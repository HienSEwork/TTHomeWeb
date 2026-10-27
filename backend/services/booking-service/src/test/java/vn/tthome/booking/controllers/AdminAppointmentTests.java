package vn.tthome.booking.controllers;

import static org.assertj.core.api.Assertions.assertThat;
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

import vn.tthome.booking.BookingIntegrationTestBase;
import vn.tthome.booking.support.TestTokens;

/** The appointment endpoints against a real PostgreSQL: mapping, filters, calendar overlap and history. */
@AutoConfigureMockMvc
class AdminAppointmentTests extends BookingIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/booking/appointments";

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

	/** Customers book appointments through another endpoint; the admin tests start from a stored one. */
	private UUID insert(UUID project, String status, Instant at, int minutes, UUID staff, String contact) {
		UUID id = UUID.randomUUID();
		jdbc.sql("insert into booking.appointment (id, code, customer_id, project_id, scheduled_at, duration_min, status, "
				+ "staff_id, contact_name, contact_phone) values (:id, :code, :customer, :project, :at, :minutes, :status, :staff, "
				+ ":contact, '0912345678')").param("id", id).param("code", "A-" + marker()).param("customer", UUID.randomUUID())
				.param("project", project).param("at", java.sql.Timestamp.from(at)).param("minutes", minutes).param("status", status)
				.param("staff", staff).param("contact", contact).update();
		return id;
	}

	private int historyRows(UUID id) {
		return jdbc.sql("select count(*) from booking.appointment_history where appointment_id = :id").param("id", id)
				.query(Integer.class).single();
	}

	@Test
	void anAppointmentRoundTripsItsFieldsWithAnEmptyHistory() throws Exception {
		UUID id = insert(UUID.randomUUID(), "pending", Instant.parse("2026-12-01T09:00:00Z"), 45, null, "Nguyen An");

		asAdmin(get(BASE + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("pending"))
				.andExpect(jsonPath("$.scheduledAt").value("2026-12-01T09:00:00Z")).andExpect(jsonPath("$.durationMin").value(45))
				.andExpect(jsonPath("$.contactName").value("Nguyen An")).andExpect(jsonPath("$.contactPhone").value("0912345678"))
				.andExpect(jsonPath("$.mode").value("in_person")).andExpect(jsonPath("$.history.length()").value(0))
				.andExpect(jsonPath("$.createdAt").isNotEmpty());
		asAdmin(get(BASE + "/" + UUID.randomUUID())).andExpect(status().isNotFound());
	}

	@Test
	void listFiltersByStatusStaffProjectTimeAndTextInVisitOrder() throws Exception {
		UUID project = UUID.randomUUID();
		UUID staff = UUID.randomUUID();
		String name = "Khach " + marker();
		Instant base = Instant.parse("2027-01-10T08:00:00Z");
		UUID later = insert(project, "confirmed", base.plus(2, ChronoUnit.HOURS), 30, staff, name);
		UUID earlier = insert(project, "pending", base, 30, null, name);
		insert(UUID.randomUUID(), "pending", base, 30, null, "Other " + marker());

		asAdmin(get(BASE + "?projectId=" + project)).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].id").value(earlier.toString())).andExpect(jsonPath("$.items[1].id").value(later.toString()));
		asAdmin(get(BASE + "?projectId=" + project + "&status=confirmed")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?projectId=" + project + "&staffId=" + staff)).andExpect(jsonPath("$.items[0].id").value(later.toString()));
		asAdmin(get(BASE + "?projectId=" + project + "&from=2027-01-10T09:00:00Z")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?projectId=" + project + "&to=2027-01-10T09:00:00Z")).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].id").value(earlier.toString()));
		asAdmin(get(BASE + "?q=" + name.toUpperCase())).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(BASE + "?q=0912345&projectId=" + project)).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(BASE + "?projectId=" + project + "&size=1&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].id").value(later.toString())).andExpect(jsonPath("$.total").value(2));
	}

	@Test
	void staffCannotBeDoubleBookedButBackToBackVisitsAreFine() throws Exception {
		UUID project = UUID.randomUUID();
		UUID staff = UUID.randomUUID();
		Instant nine = Instant.parse("2027-02-01T09:00:00Z");
		insert(project, "confirmed", nine, 60, staff, "A");
		UUID overlapping = insert(project, "pending", nine.plus(30, ChronoUnit.MINUTES), 30, null, "B");
		UUID backToBack = insert(project, "pending", nine.plus(60, ChronoUnit.MINUTES), 30, null, "C");
		UUID cancelledNeighbour = insert(project, "cancelled", nine.plus(2, ChronoUnit.HOURS), 30, staff, "D");
		UUID free = insert(project, "pending", nine.plus(2, ChronoUnit.HOURS), 30, null, "E");

		asAdmin(json(put(BASE + "/" + overlapping + "/staff"), "{\"staffId\":\"" + staff + "\"}")).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/" + backToBack + "/staff"), "{\"staffId\":\"" + staff + "\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.staffId").value(staff.toString()));
		asAdmin(json(put(BASE + "/" + free + "/staff"), "{\"staffId\":\"" + staff + "\"}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + cancelledNeighbour + "/staff"), "{\"staffId\":null}")).andExpect(status().isConflict());

		asAdmin(json(put(BASE + "/" + free + "/staff"), "{\"staffId\":null}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.staffId").doesNotExist());
		assertThat(historyRows(backToBack)).isEqualTo(1);
		assertThat(historyRows(free)).isEqualTo(2);
	}

	@Test
	void anAppointmentGoesThroughItsLifeAndEveryStepIsInTheHistory() throws Exception {
		UUID id = insert(UUID.randomUUID(), "pending", Instant.now().plus(2, ChronoUnit.DAYS), 30, null, "Flow");
		String status = BASE + "/" + id + "/status";

		asAdmin(json(put(status), "{\"status\":\"completed\"}")).andExpect(status().isConflict());
		asAdmin(json(put(status), "{\"status\":\"confirmed\",\"note\":\" Called \"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("confirmed")).andExpect(jsonPath("$.note").value("Called"));
		asAdmin(json(put(status), "{\"status\":\"completed\"}")).andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/" + id + "/reschedule"), "{\"scheduledAt\":\"" + Instant.now().plus(3, ChronoUnit.DAYS)
				+ "\",\"durationMin\":60,\"note\":\"Customer asked\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("rescheduled")).andExpect(jsonPath("$.durationMin").value(60));
		asAdmin(json(put(status), "{\"status\":\"cancelled\"}")).andExpect(status().isBadRequest());
		asAdmin(json(put(status), "{\"status\":\"cancelled\",\"reason\":\"Customer found a room\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.cancelReason").value("Customer found a room"));
		asAdmin(json(put(status), "{\"status\":\"confirmed\"}")).andExpect(status().isConflict());

		asAdmin(get(BASE + "/" + id)).andExpect(jsonPath("$.history.length()").value(3))
				.andExpect(jsonPath("$.history[0].fromStatus").value("pending")).andExpect(jsonPath("$.history[0].toStatus").value("confirmed"))
				.andExpect(jsonPath("$.history[1].toStatus").value("rescheduled")).andExpect(jsonPath("$.history[2].toStatus").value("cancelled"))
				.andExpect(jsonPath("$.history[2].note").value("Customer found a room")).andExpect(jsonPath("$.history[0].changedBy").isNotEmpty());
	}

	@Test
	void aVisitThatHasPassedCanBeCompletedOrMarkedNoShow() throws Exception {
		UUID done = insert(UUID.randomUUID(), "confirmed", Instant.now().minus(1, ChronoUnit.DAYS), 30, null, "Done");
		UUID absent = insert(UUID.randomUUID(), "confirmed", Instant.now().minus(1, ChronoUnit.DAYS), 30, null, "Absent");

		asAdmin(json(put(BASE + "/" + done + "/status"), "{\"status\":\"completed\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("completed"));
		asAdmin(json(put(BASE + "/" + absent + "/status"), "{\"status\":\"no_show\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("no_show"));
		asAdmin(json(put(BASE + "/" + done + "/staff"), "{\"staffId\":\"" + UUID.randomUUID() + "\"}")).andExpect(status().isConflict());
	}

	@Test
	void rescheduleChecksTheStaffCalendarAtTheNewTime() throws Exception {
		UUID project = UUID.randomUUID();
		UUID staff = UUID.randomUUID();
		Instant day = Instant.now().plus(10, ChronoUnit.DAYS).truncatedTo(ChronoUnit.HOURS);
		UUID mine = insert(project, "confirmed", day, 30, staff, "Mine");
		insert(project, "confirmed", day.plus(5, ChronoUnit.HOURS), 60, staff, "Other");

		asAdmin(json(put(BASE + "/" + mine + "/reschedule"), "{\"scheduledAt\":\"" + day.plus(5, ChronoUnit.HOURS).plus(30, ChronoUnit.MINUTES)
				+ "\",\"durationMin\":30}")).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/" + mine + "/reschedule"), "{\"scheduledAt\":\"" + day.plus(7, ChronoUnit.HOURS)
				+ "\",\"durationMin\":30}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + mine + "/reschedule"), "{\"scheduledAt\":\"2020-01-01T00:00:00Z\",\"durationMin\":30}"))
				.andExpect(status().isBadRequest());
	}

	@Test
	void theNoteCanBeSetAndCleared() throws Exception {
		UUID id = insert(UUID.randomUUID(), "pending", Instant.now().plus(1, ChronoUnit.DAYS), 30, null, "Note");

		asAdmin(json(put(BASE + "/" + id + "/note"), "{\"note\":\" Has a dog \"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.note").value("Has a dog"));
		asAdmin(json(put(BASE + "/" + id + "/note"), "{\"note\":null}")).andExpect(status().isOk()).andExpect(jsonPath("$.note").doesNotExist());
		asAdmin(json(put(BASE + "/" + UUID.randomUUID() + "/note"), "{\"note\":\"x\"}")).andExpect(status().isNotFound());
	}

}
