package vn.tthome.listing.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.listing.ListingIntegrationTestBase;
import vn.tthome.listing.support.TestTokens;

/** The inventory figures against a real PostgreSQL. The database is shared, so the checks are on differences. */
@AutoConfigureMockMvc
class AdminInventoryStatsTests extends ListingIntegrationTestBase {

	@Autowired
	MockMvc mvc;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	private long figure(String field) throws Exception {
		String body = asAdmin(get("/api/v1/admin/stats/inventory")).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		return Long.parseLong(body.replaceAll(".*\"" + field + "\":(\\d+).*", "$1"));
	}

	@Test
	void theCountsFollowTheRoomsThatAreAdded() throws Exception {
		long projects = figure("projects");
		long rooms = figure("rooms");
		long vacant = figure("vacant");
		long rented = figure("rented");
		String project = idOf(asAdmin(json(post("/api/v1/admin/projects"), "{\"name\":\"Stats " + UUID.randomUUID() + "\",\"petPolicy\":\"none\"}"))
				.andExpect(status().isCreated()));
		String room = idOf(asAdmin(json(post("/api/v1/admin/projects/" + project + "/rooms"),
				"{\"code\":\"1\",\"title\":\"A\",\"roomType\":\"studio\",\"price\":3000000}")).andExpect(status().isCreated()));
		asAdmin(json(post("/api/v1/admin/projects/" + project + "/rooms"), "{\"code\":\"2\",\"title\":\"B\",\"roomType\":\"studio\",\"price\":4000000}"))
				.andExpect(status().isCreated());

		org.assertj.core.api.Assertions.assertThat(figure("projects")).isEqualTo(projects + 1);
		org.assertj.core.api.Assertions.assertThat(figure("rooms")).isEqualTo(rooms + 2);
		org.assertj.core.api.Assertions.assertThat(figure("vacant")).isEqualTo(vacant + 2);

		asAdmin(json(put("/api/v1/admin/rooms/" + room + "/availability"), "{\"status\":\"rented\"}")).andExpect(status().isOk());
		org.assertj.core.api.Assertions.assertThat(figure("vacant")).isEqualTo(vacant + 1);
		org.assertj.core.api.Assertions.assertThat(figure("rented")).isEqualTo(rented + 1);
	}

	@Test
	void theBusiestProjectsComeFirstWithTheirOccupancy() throws Exception {
		String project = idOf(asAdmin(json(post("/api/v1/admin/projects"), "{\"name\":\"Crowded " + UUID.randomUUID() + "\",\"petPolicy\":\"none\"}"))
				.andExpect(status().isCreated()));
		String first = null;
		for (int i = 0; i < 1000; i++) {
			if (i >= 4) {
				break;
			}
			String id = idOf(asAdmin(json(post("/api/v1/admin/projects/" + project + "/rooms"),
					"{\"code\":\"R" + i + "\",\"title\":\"R\",\"roomType\":\"studio\",\"price\":" + (2_000_000 + i) + "}")).andExpect(status().isCreated()));
			first = first == null ? id : first;
		}
		asAdmin(json(put("/api/v1/admin/rooms/" + first + "/availability"), "{\"status\":\"rented\"}")).andExpect(status().isOk());

		asAdmin(get("/api/v1/admin/stats/projects?size=50")).andExpect(status().isOk()).andExpect(jsonPath("$[?(@.id=='" + project + "')].totalRooms").value(4))
				.andExpect(jsonPath("$[?(@.id=='" + project + "')].vacantCount").value(3))
				.andExpect(jsonPath("$[?(@.id=='" + project + "')].occupancy").value(0.25))
				.andExpect(jsonPath("$[?(@.id=='" + project + "')].minPrice").value(2000001));
	}

}
