package vn.tthome.listing.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.listing.ListingIntegrationTestBase;
import vn.tthome.listing.support.TestTokens;

/** The project endpoints against a real PostgreSQL: mapping, generated codes and slugs, references. */
@AutoConfigureMockMvc
class AdminProjectTests extends ListingIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/projects";
	private static final AtomicInteger IDS = new AtomicInteger(800_000);

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String marker() {
		return "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	private int unit(Integer parent, int level, String scheme) {
		int id = IDS.incrementAndGet();
		jdbc.sql("insert into inventory.admin_unit (id, parent_id, level, scheme, name, slug) values (:id, :parent, :level, "
				+ ":scheme, :name, :slug)").param("id", id).param("parent", parent).param("level", level)
				.param("scheme", scheme).param("name", "U" + id).param("slug", "u" + id).update();
		return id;
	}

	private static String body(String name, Integer ward, Integer wardNew, Integer district) {
		return "{\"name\":\"" + name + "\",\"streetAddress\":\"12 Nguyen Hue\",\"wardId\":" + ward + ",\"wardNewId\":"
				+ wardNew + ",\"districtId\":" + district + ",\"lat\":10.77,\"lng\":106.7,\"exclusive\":true,"
				+ "\"petPolicy\":\"cat\",\"evParking\":true,\"freeHours\":true,\"feeElectric\":3500,\"feeWater\":15000,"
				+ "\"description\":\"Quiet building\"}";
	}

	private String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString()
				.replaceAll(".*\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	@Test
	void aProjectIsCreatedWithAGeneratedCodeAndSlugAndRoundTripsEveryField() throws Exception {
		int province = unit(null, 1, "pre_2025");
		int district = unit(province, 2, "pre_2025");
		int ward = unit(district, 3, "pre_2025");
		int provinceNew = unit(null, 1, "post_2025");
		int wardNew = unit(provinceNew, 3, "post_2025");
		String name = "Căn hộ " + marker();

		String id = idOf(asAdmin(json(post(BASE), body(name, ward, wardNew, district))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.code").value(org.hamcrest.Matchers.matchesPattern("PRJ-[a-z0-9]{20}")))
				.andExpect(jsonPath("$.slug").value(org.hamcrest.Matchers.startsWith("can-ho-m")))
				.andExpect(jsonPath("$.status").value("active")).andExpect(jsonPath("$.vacantCount").value(0))
				.andExpect(jsonPath("$.totalRooms").value(0)));

		asAdmin(get(BASE + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.name").value(name))
				.andExpect(jsonPath("$.wardId").value(ward)).andExpect(jsonPath("$.wardNewId").value(wardNew))
				.andExpect(jsonPath("$.districtId").value(district)).andExpect(jsonPath("$.lat").value(10.77))
				.andExpect(jsonPath("$.exclusive").value(true)).andExpect(jsonPath("$.petPolicy").value("cat"))
				.andExpect(jsonPath("$.evParking").value(true)).andExpect(jsonPath("$.freeHours").value(true))
				.andExpect(jsonPath("$.feeElectric").value(3500)).andExpect(jsonPath("$.feeWater").value(15000))
				.andExpect(jsonPath("$.feeService").doesNotExist()).andExpect(jsonPath("$.minPrice").doesNotExist())
				.andExpect(jsonPath("$.amenityIds.length()").value(0));
	}

	@Test
	void anAreaThatDoesNotFitIsRejected() throws Exception {
		int province = unit(null, 1, "pre_2025");
		int district = unit(province, 2, "pre_2025");
		int ward = unit(district, 3, "pre_2025");

		asAdmin(json(post(BASE), body("X " + marker(), district, null, null))).andExpect(status().isBadRequest());
		asAdmin(json(post(BASE), body("X " + marker(), null, ward, null))).andExpect(status().isBadRequest());
		asAdmin(json(post(BASE), body("X " + marker(), null, null, ward))).andExpect(status().isBadRequest());
		asAdmin(json(post(BASE), body("X " + marker(), 999_999_999, null, null))).andExpect(status().isBadRequest());
	}

	@Test
	void theSlugFollowsTheNameAndStaysUniqueAmongLiveProjects() throws Exception {
		String name = "Same Name " + marker();
		String first = idOf(asAdmin(json(post(BASE), body(name, null, null, null))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.slug").value(slugOf(name))));
		asAdmin(json(post(BASE), body(name, null, null, null))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.slug").value(slugOf(name) + "-2"));

		asAdmin(json(put(BASE + "/" + first), body(name, null, null, null))).andExpect(status().isOk())
				.andExpect(jsonPath("$.slug").value(slugOf(name)));
		asAdmin(json(put(BASE + "/" + first), body("Renamed " + name, null, null, null))).andExpect(status().isOk())
				.andExpect(jsonPath("$.slug").value(slugOf("Renamed " + name)));
		asAdmin(json(put(BASE + "/" + UUID.randomUUID()), body(name, null, null, null))).andExpect(status().isNotFound());
	}

	private static String slugOf(String text) {
		return vn.tthome.listing.commons.Slugs.of(text);
	}

	@Test
	void listFiltersByTextStatusAndAreaAndPages() throws Exception {
		int province = unit(null, 1, "pre_2025");
		int district = unit(province, 2, "pre_2025");
		String m = marker();
		String a = idOf(asAdmin(json(post(BASE), body("Alpha " + m, null, null, district))));
		idOf(asAdmin(json(post(BASE), body("Beta " + m, null, null, null))));
		asAdmin(json(put(BASE + "/" + a + "/status"), "{\"status\":\"hidden\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("hidden"));

		asAdmin(get(BASE + "?q=" + m.toUpperCase())).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].name").value("Alpha " + m));
		asAdmin(get(BASE + "?q=" + m + "&status=hidden")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?q=" + m + "&districtId=" + district)).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?q=" + m + "&size=1&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].name").value("Beta " + m)).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(BASE + "?q=12 nguyen hue")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + a + "/status"), "{\"status\":\"gone\"}")).andExpect(status().isBadRequest());
	}

	@Test
	void amenitiesAreReplacedAndOnlyProjectOrSharedOnesAreAccepted() throws Exception {
		String id = idOf(asAdmin(json(post(BASE), body("Amenities " + marker(), null, null, null))));
		// seed: 4 elevator (project), 8 washing machine (both), 1 window (room)
		asAdmin(json(put(BASE + "/" + id + "/amenities"), "{\"amenityIds\":[8,4,8]}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.amenityIds.length()").value(2)).andExpect(jsonPath("$.amenityIds[0]").value(4))
				.andExpect(jsonPath("$.amenityIds[1]").value(8));
		asAdmin(json(put(BASE + "/" + id + "/amenities"), "{\"amenityIds\":[1]}")).andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/" + id + "/amenities"), "{\"amenityIds\":[30000]}")).andExpect(status().isBadRequest());
		asAdmin(get(BASE + "/" + id)).andExpect(jsonPath("$.amenityIds.length()").value(2));

		asAdmin(json(put(BASE + "/" + id + "/amenities"), "{\"amenityIds\":[]}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.amenityIds.length()").value(0));
		assertThat(jdbc.sql("select count(*) from inventory.project_amenity where project_id = cast(:id as uuid)")
				.param("id", id).query(Integer.class).single()).isZero();
	}

	@Test
	void aProjectWithRoomsCannotBeDeletedAndADeletedOneDisappears() throws Exception {
		String m = marker();
		String id = idOf(asAdmin(json(post(BASE), body("Doomed " + m, null, null, null))));
		UUID room = UUID.randomUUID();
		jdbc.sql("insert into inventory.room (id, project_id, code, title, slug, room_type) values (:id, cast(:p as uuid), "
				+ "'101', 'Room', :slug, 'studio')").param("id", room).param("p", id).param("slug", "r-" + m).update();

		asAdmin(delete(BASE + "/" + id)).andExpect(status().isConflict());

		jdbc.sql("update inventory.room set deleted_at = now() where id = :id").param("id", room).update();
		asAdmin(delete(BASE + "/" + id)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/" + id)).andExpect(status().isNotFound());
		asAdmin(get(BASE + "?q=" + m)).andExpect(jsonPath("$.total").value(0));
		asAdmin(delete(BASE + "/" + id)).andExpect(status().isNotFound());
		// the name and slug are free again
		asAdmin(json(post(BASE), body("Doomed " + m, null, null, null))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.slug").value(slugOf("Doomed " + m)));
	}

}
