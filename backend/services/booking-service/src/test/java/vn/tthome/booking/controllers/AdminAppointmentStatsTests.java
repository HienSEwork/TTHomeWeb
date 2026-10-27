package vn.tthome.booking.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.booking.BookingIntegrationTestBase;
import vn.tthome.booking.support.TestTokens;

/** The appointment figures against a real PostgreSQL, over a period no other test writes into. */
@AutoConfigureMockMvc
class AdminAppointmentStatsTests extends BookingIntegrationTestBase {

	private static final String PATH = "/api/v1/admin/stats/appointments";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private void insert(String status, Instant visit, Instant created) {
		jdbc.sql("insert into booking.appointment (id, code, customer_id, project_id, scheduled_at, status, created_at) values (gen_random_uuid(), "
				+ ":code, gen_random_uuid(), gen_random_uuid(), :visit, :status, :created)").param("code", "S-" + UUID.randomUUID())
				.param("visit", java.sql.Timestamp.from(visit)).param("status", status).param("created", java.sql.Timestamp.from(created)).update();
	}

	@Test
	void appointmentsCreatedInThePeriodAreCountedByStatus() throws Exception {
		Instant day = Instant.parse("2020-03-10T09:00:00Z");
		insert("pending", day.plus(5, ChronoUnit.DAYS), day);
		insert("pending", day.plus(5, ChronoUnit.DAYS), day.plus(1, ChronoUnit.HOURS));
		insert("confirmed", day.plus(6, ChronoUnit.DAYS), day.plus(2, ChronoUnit.HOURS));
		insert("cancelled", day.plus(6, ChronoUnit.DAYS), day.plus(40, ChronoUnit.DAYS));

		asAdmin(get(PATH + "?from=2020-03-10T00:00:00Z&to=2020-03-11T00:00:00Z")).andExpect(status().isOk())
				.andExpect(jsonPath("$.created").value(3)).andExpect(jsonPath("$.createdByStatus.pending").value(2))
				.andExpect(jsonPath("$.createdByStatus.confirmed").value(1)).andExpect(jsonPath("$.createdByStatus.cancelled").doesNotExist());
	}

	@Test
	void upcomingAndPendingCountsMoveWithTheAppointments() throws Exception {
		long before = Long.parseLong(asAdmin(get(PATH)).andReturn().getResponse().getContentAsString().replaceAll(".*\"upcomingOpen\":(\\d+).*", "$1"));
		Instant now = Instant.now();
		insert("confirmed", now.plus(2, ChronoUnit.DAYS), now);
		insert("pending", now.plus(3, ChronoUnit.DAYS), now);
		insert("confirmed", now.plus(20, ChronoUnit.DAYS), now);
		insert("cancelled", now.plus(2, ChronoUnit.DAYS), now);

		String body = asAdmin(get(PATH)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		long after = Long.parseLong(body.replaceAll(".*\"upcomingOpen\":(\\d+).*", "$1"));
		org.assertj.core.api.Assertions.assertThat(after).isEqualTo(before + 2);
		asAdmin(get(PATH + "?from=2026-01-02T00:00:00Z&to=2026-01-01T00:00:00Z")).andExpect(status().isBadRequest());
	}

}
