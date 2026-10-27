package vn.tthome.consignment.controllers;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.consignment.ConsignmentIntegrationTestBase;
import vn.tthome.consignment.support.TestTokens;

/** The submission endpoints against a real PostgreSQL: mapping, the JSON rooms, filters and the review log. */
@AutoConfigureMockMvc
class AdminSubmissionTests extends ConsignmentIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/consignment/submissions";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private final UUID reviewer = UUID.randomUUID();

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.bearerFor(reviewer, "ADMIN")));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String marker() {
		return "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	private UUID insert(String landlord, String status, Instant at, String address) {
		UUID id = UUID.randomUUID();
		jdbc.sql("insert into consignment.submission (id, code, landlord_name, landlord_phone, project_name, address_text, ward_id, "
				+ "room_count, rooms, expected_price_min, expected_price_max, note, status, created_at) values (:id, :code, :name, "
				+ "'0912345678', 'Green House', :address, 760, 3, cast(:rooms as jsonb), 3000000, 4500000, 'Near the market', :status, :at)")
				.param("id", id).param("code", "KG-" + marker()).param("name", landlord).param("address", address)
				.param("rooms", "[{\"type\": \"studio\", \"area\": 25}]").param("status", status)
				.param("at", java.sql.Timestamp.from(at)).update();
		return id;
	}

	@Test
	void aSubmissionRoundTripsItsFieldsAndTheRoomsJson() throws Exception {
		UUID id = insert("Chu Nha " + marker(), "submitted", Instant.parse("2026-09-01T08:00:00Z"), "12 Nguyen Hue");

		asAdmin(get(BASE + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("submitted"))
				.andExpect(jsonPath("$.landlordPhone").value("0912345678")).andExpect(jsonPath("$.projectName").value("Green House"))
				.andExpect(jsonPath("$.addressText").value("12 Nguyen Hue")).andExpect(jsonPath("$.wardId").value(760))
				.andExpect(jsonPath("$.roomCount").value(3)).andExpect(jsonPath("$.expectedPriceMin").value(3000000))
				.andExpect(jsonPath("$.expectedPriceMax").value(4500000)).andExpect(jsonPath("$.note").value("Near the market"))
				.andExpect(jsonPath("$.roomsJson").value(containsString("studio"))).andExpect(jsonPath("$.createdAt").value("2026-09-01T08:00:00Z"))
				.andExpect(jsonPath("$.reviewLog.length()").value(0));
		asAdmin(get(BASE + "/" + UUID.randomUUID())).andExpect(status().isNotFound());
	}

	@Test
	void listFiltersByStatusTimeAndTextOldestFirst() throws Exception {
		String m = marker();
		Instant base = Instant.parse("2027-03-01T08:00:00Z");
		UUID newer = insert("Newer " + m, "submitted", base.plus(2, ChronoUnit.DAYS), "Street A");
		UUID older = insert("Older " + m, "need_info", base, "Street B " + m);
		insert("Other " + marker(), "submitted", base, "Elsewhere");

		asAdmin(get(BASE + "?q=" + m.toUpperCase())).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].id").value(older.toString())).andExpect(jsonPath("$.items[1].id").value(newer.toString()));
		asAdmin(get(BASE + "?q=" + m + "&status=need_info")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?q=" + m + "&from=2027-03-02T00:00:00Z")).andExpect(jsonPath("$.items[0].id").value(newer.toString()));
		asAdmin(get(BASE + "?q=" + m + "&to=2027-03-02T00:00:00Z")).andExpect(jsonPath("$.items[0].id").value(older.toString()));
		asAdmin(get(BASE + "?q=0912345&status=submitted&from=2027-03-01T00:00:00Z&to=2027-03-02T00:00:00Z")).andExpect(status().isOk());
		asAdmin(get(BASE + "?q=" + m + "&size=1&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].id").value(newer.toString())).andExpect(jsonPath("$.total").value(2));
	}

	@Test
	void aSubmissionGoesThroughAskingForInformationThenApproval() throws Exception {
		UUID id = insert("Flow " + marker(), "submitted", Instant.now().minus(1, ChronoUnit.DAYS), "Flow street");
		String review = BASE + "/" + id + "/review";

		asAdmin(json(put(review), "{\"decision\":\"need_info\"}")).andExpect(status().isBadRequest());
		asAdmin(json(put(review), "{\"decision\":\"need_info\",\"note\":\" Send the floor plan \"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("need_info")).andExpect(jsonPath("$.reviewerId").value(reviewer.toString()));
		asAdmin(json(put(review), "{\"decision\":\"approve\",\"note\":\"Plan received\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("approved"));
		asAdmin(json(put(review), "{\"decision\":\"reject\",\"note\":\"Changed mind\"}")).andExpect(status().isConflict());

		asAdmin(get(BASE + "/" + id)).andExpect(jsonPath("$.reviewLog.length()").value(2))
				.andExpect(jsonPath("$.reviewLog[0].fromStatus").value("submitted")).andExpect(jsonPath("$.reviewLog[0].toStatus").value("need_info"))
				.andExpect(jsonPath("$.reviewLog[0].note").value("Send the floor plan"))
				.andExpect(jsonPath("$.reviewLog[1].toStatus").value("approved")).andExpect(jsonPath("$.reviewLog[1].reviewerId").value(reviewer.toString()));
	}

	@Test
	void rejectingKeepsTheReasonAndClosesTheSubmission() throws Exception {
		UUID id = insert("Reject " + marker(), "submitted", Instant.now().minus(1, ChronoUnit.DAYS), "Far away");
		String review = BASE + "/" + id + "/review";

		asAdmin(json(put(review), "{\"decision\":\"reject\"}")).andExpect(status().isBadRequest());
		asAdmin(json(put(review), "{\"decision\":\"reject\",\"note\":\" Outside our area \"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("rejected")).andExpect(jsonPath("$.rejectReason").value("Outside our area"));
		asAdmin(json(put(review), "{\"decision\":\"approve\"}")).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/" + UUID.randomUUID() + "/review"), "{\"decision\":\"approve\"}")).andExpect(status().isNotFound());
	}

}
