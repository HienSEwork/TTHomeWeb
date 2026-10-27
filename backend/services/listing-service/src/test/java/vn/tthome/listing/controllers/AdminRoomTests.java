package vn.tthome.listing.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

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

/** The room endpoints against a real PostgreSQL: mapping, history, project counters and constraints. */
@AutoConfigureMockMvc
class AdminRoomTests extends ListingIntegrationTestBase {

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

	private static String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	private String newProject() throws Exception {
		return idOf(asAdmin(json(post("/api/v1/admin/projects"),
				"{\"name\":\"Proj " + marker() + "\",\"petPolicy\":\"none\"}")).andExpect(status().isCreated()));
	}

	private static String roomBody(String code, String type, Long price) {
		return "{\"code\":\"" + code + "\",\"title\":\"Room " + code + "\",\"roomType\":\"" + type
				+ "\",\"floor\":3,\"areaM2\":25.5,\"price\":" + price + ",\"priceInclUtility\":true,\"deposit\":1000000,"
				+ "\"furniture\":\"full\",\"hasBalcony\":true,\"hasWindow\":false,\"maxOccupants\":2,"
				+ "\"availableFrom\":\"2026-12-01\",\"promo\":true,\"promoNote\":\"First month free\"}";
	}

	private ResultActions createRoom(String project, String code, String type, Long price) throws Exception {
		return asAdmin(json(post("/api/v1/admin/projects/" + project + "/rooms"), roomBody(code, type, price)));
	}

	private int historyCount(String room) {
		return jdbc.sql("select count(*) from inventory.room_status_history where room_id = cast(:id as uuid)")
				.param("id", room).query(Integer.class).single();
	}

	private void assertSummary(String project, int total, int vacant, Long minPrice, List<String> types) {
		var row = jdbc.sql("select total_rooms, vacant_count, min_price, room_types from inventory.project "
				+ "where id = cast(:id as uuid)").param("id", project).query().singleRow();
		assertThat(((Number) row.get("total_rooms")).intValue()).isEqualTo(total);
		assertThat(((Number) row.get("vacant_count")).intValue()).isEqualTo(vacant);
		assertThat(row.get("min_price") == null ? null : ((Number) row.get("min_price")).longValue()).isEqualTo(minPrice);
		assertThat(jdbc.sql("select array_to_string(room_types, ',') from inventory.project where id = cast(:id as uuid)")
				.param("id", project).query(String.class).single()).isEqualTo(String.join(",", types));
	}

	@Test
	void aRoomRoundTripsEveryFieldAndStartsTheHistoryAndTheProjectCounters() throws Exception {
		String project = newProject();

		String room = idOf(createRoom(project, "101", "studio", 4_500_000L).andExpect(status().isCreated())
				.andExpect(jsonPath("$.status").value("available")).andExpect(jsonPath("$.slug").isNotEmpty()));

		asAdmin(get("/api/v1/admin/rooms/" + room)).andExpect(status().isOk())
				.andExpect(jsonPath("$.projectId").value(project)).andExpect(jsonPath("$.code").value("101"))
				.andExpect(jsonPath("$.roomType").value("studio")).andExpect(jsonPath("$.floor").value(3))
				.andExpect(jsonPath("$.areaM2").value(25.5)).andExpect(jsonPath("$.price").value(4500000))
				.andExpect(jsonPath("$.priceInclUtility").value(true)).andExpect(jsonPath("$.deposit").value(1000000))
				.andExpect(jsonPath("$.furniture").value("full")).andExpect(jsonPath("$.hasBalcony").value(true))
				.andExpect(jsonPath("$.hasWindow").value(false)).andExpect(jsonPath("$.maxOccupants").value(2))
				.andExpect(jsonPath("$.availableFrom").value("2026-12-01")).andExpect(jsonPath("$.promo").value(true))
				.andExpect(jsonPath("$.promoNote").value("First month free"));
		assertThat(historyCount(room)).isEqualTo(1);
		assertSummary(project, 1, 1, 4_500_000L, List.of("studio"));
		asAdmin(get("/api/v1/admin/projects/" + project)).andExpect(jsonPath("$.totalRooms").value(1))
				.andExpect(jsonPath("$.vacantCount").value(1)).andExpect(jsonPath("$.minPrice").value(4500000));
	}

	@Test
	void theProjectCountersFollowStatusPriceAndDeletion() throws Exception {
		String project = newProject();
		String cheap = idOf(createRoom(project, "101", "studio", 3_000_000L).andExpect(status().isCreated()));
		String dear = idOf(createRoom(project, "102", "1pn", 6_000_000L).andExpect(status().isCreated()));
		assertSummary(project, 2, 2, 3_000_000L, List.of("1pn", "studio"));

		asAdmin(json(put("/api/v1/admin/rooms/" + cheap + "/availability"), "{\"status\":\"rented\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.status").value("rented"))
				.andExpect(jsonPath("$.price").value(3000000));
		assertSummary(project, 2, 1, 6_000_000L, List.of("1pn", "studio"));

		asAdmin(json(put("/api/v1/admin/rooms/" + dear + "/availability"), "{\"price\":5500000}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.price").value(5500000));
		assertSummary(project, 2, 1, 5_500_000L, List.of("1pn", "studio"));

		asAdmin(json(put("/api/v1/admin/rooms/" + dear + "/availability"), "{\"status\":\"hidden\",\"price\":5000000}"))
				.andExpect(status().isOk());
		assertSummary(project, 1, 0, null, List.of("studio"));

		asAdmin(delete("/api/v1/admin/rooms/" + cheap)).andExpect(status().isNoContent());
		assertSummary(project, 0, 0, null, List.of());
		assertThat(historyCount(dear)).isEqualTo(3); // created, new price, hidden with a new price
		asAdmin(get("/api/v1/admin/rooms/" + cheap)).andExpect(status().isNotFound());
	}

	@Test
	void updatingAPriceIsRecordedAndAnUnchangedPriceIsNot() throws Exception {
		String project = newProject();
		String room = idOf(createRoom(project, "101", "studio", 3_000_000L).andExpect(status().isCreated()));

		asAdmin(json(put("/api/v1/admin/rooms/" + room), roomBody("101", "duplex", 3_000_000L))).andExpect(status().isOk())
				.andExpect(jsonPath("$.roomType").value("duplex"));
		assertThat(historyCount(room)).isEqualTo(1);

		asAdmin(json(put("/api/v1/admin/rooms/" + room), roomBody("101", "duplex", 3_300_000L))).andExpect(status().isOk());
		assertThat(historyCount(room)).isEqualTo(2);
		assertSummary(project, 1, 1, 3_300_000L, List.of("duplex"));
	}

	@Test
	void aRoomCodeIsUniquePerProjectEvenAfterDeletion() throws Exception {
		String project = newProject();
		String other = newProject();
		String room = idOf(createRoom(project, "101", "studio", 1L).andExpect(status().isCreated()));
		createRoom(project, "102", "studio", 1L).andExpect(status().isCreated());

		createRoom(project, "101", "studio", 1L).andExpect(status().isConflict());
		createRoom(other, "101", "studio", 1L).andExpect(status().isCreated());
		asAdmin(json(put("/api/v1/admin/rooms/" + room), roomBody("102", "studio", 1L))).andExpect(status().isConflict());

		asAdmin(delete("/api/v1/admin/rooms/" + room)).andExpect(status().isNoContent());
		createRoom(project, "101", "studio", 1L).andExpect(status().isConflict());
	}

	@Test
	void slugsAreUniqueAmongLiveRooms() throws Exception {
		String project = newProject();
		String name = jdbc.sql("select slug from inventory.project where id = cast(:id as uuid)").param("id", project)
				.query(String.class).single();
		String first = idOf(createRoom(project, "A1", "studio", 1L).andExpect(status().isCreated())
				.andExpect(jsonPath("$.slug").value(name + "-a1")));

		asAdmin(delete("/api/v1/admin/rooms/" + first)).andExpect(status().isNoContent());
		// the slug of a deleted room is free again (the code differs only in case, so it is free too)
		createRoom(project, "a1", "studio", 1L).andExpect(status().isCreated())
				.andExpect(jsonPath("$.slug").value(name + "-a1"));
	}

	@Test
	void amenitiesAreReplacedAndProjectOnlyOnesAreRefused() throws Exception {
		String project = newProject();
		String room = idOf(createRoom(project, "101", "studio", 1L).andExpect(status().isCreated()));
		// seed: 1 window (room), 8 washing machine (both), 4 elevator (project)

		asAdmin(json(put("/api/v1/admin/rooms/" + room + "/amenities"), "{\"amenityIds\":[8,1,1]}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.amenityIds.length()").value(2))
				.andExpect(jsonPath("$.amenityIds[0]").value(1)).andExpect(jsonPath("$.amenityIds[1]").value(8));
		asAdmin(json(put("/api/v1/admin/rooms/" + room + "/amenities"), "{\"amenityIds\":[4]}"))
				.andExpect(status().isBadRequest());
		asAdmin(json(put("/api/v1/admin/rooms/" + room + "/amenities"), "{\"amenityIds\":[30000]}"))
				.andExpect(status().isBadRequest());
		asAdmin(get("/api/v1/admin/rooms/" + room)).andExpect(jsonPath("$.amenityIds.length()").value(2));
		asAdmin(json(put("/api/v1/admin/rooms/" + room + "/amenities"), "{\"amenityIds\":[]}"))
				.andExpect(jsonPath("$.amenityIds.length()").value(0));
	}

	@Test
	void roomsAreListedByProjectWithFiltersAndPaging() throws Exception {
		String project = newProject();
		String c = idOf(createRoom(project, "C3", "studio", 1L).andExpect(status().isCreated()));
		createRoom(project, "A1", "studio", 1L).andExpect(status().isCreated());
		createRoom(project, "B2", "studio", 1L).andExpect(status().isCreated());
		asAdmin(json(put("/api/v1/admin/rooms/" + c + "/availability"), "{\"status\":\"reserved\"}")).andExpect(status().isOk());

		String base = "/api/v1/admin/projects/" + project + "/rooms";
		asAdmin(get(base)).andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.items[0].code").value("A1"))
				.andExpect(jsonPath("$.items[2].code").value("C3"));
		asAdmin(get(base + "?status=reserved")).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].code").value("C3"));
		asAdmin(get(base + "?q=b2")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(base + "?size=2&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].code").value("C3")).andExpect(jsonPath("$.total").value(3));
		asAdmin(get("/api/v1/admin/projects/" + UUID.randomUUID() + "/rooms")).andExpect(status().isNotFound());
	}

	@Test
	void invalidRoomsAreRefused() throws Exception {
		String project = newProject();

		createRoom(project, "101", "castle", 1L).andExpect(status().isBadRequest());
		asAdmin(json(post("/api/v1/admin/projects/" + project + "/rooms"), roomBody("102", "studio", 1L).replace("full", "lots")))
				.andExpect(status().isBadRequest());
		createRoom(UUID.randomUUID().toString(), "101", "studio", 1L).andExpect(status().isNotFound());
	}

}
