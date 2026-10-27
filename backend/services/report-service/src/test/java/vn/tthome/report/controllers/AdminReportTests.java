package vn.tthome.report.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.ByteArrayInputStream;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import vn.tthome.report.ReportIntegrationTestBase;
import vn.tthome.report.support.TestTokens;

/** The traffic queries and the Excel file against a real PostgreSQL; the other services are not running, so they are unavailable. */
@AutoConfigureMockMvc
class AdminReportTests extends ReportIntegrationTestBase {

	private static final String PATH = "/api/v1/admin/reports/overview";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private void event(String name, String session, Instant at) {
		jdbc.sql("insert into report.event (name, session_id, created_at) values (:name, :session, :at)").param("name", name)
				.param("session", session).param("at", Timestamp.from(at)).update();
	}

	private String period(Instant from, Instant to) {
		return "?from=" + from + "&to=" + to;
	}

	@Test
	void trafficIsCountedFromTheTrackedEventsOfThePeriod() throws Exception {
		Instant now = Instant.now().truncatedTo(ChronoUnit.SECONDS);
		String a = "s-" + UUID.randomUUID();
		String b = "s-" + UUID.randomUUID();
		Instant from = now.minus(2, ChronoUnit.HOURS);
		Instant to = now.plus(1, ChronoUnit.HOURS);
		long visitors = visitors(from, to);
		event("view", a, now.minus(30, ChronoUnit.MINUTES));
		event("view", a, now.minus(20, ChronoUnit.MINUTES));
		event("view", b, now.minus(10, ChronoUnit.MINUTES));
		event("click_call", b, now.minus(5, ChronoUnit.MINUTES));
		event("view", "s-" + UUID.randomUUID(), now.plus(2, ChronoUnit.HOURS));

		MvcResult result = mvc.perform(get(PATH + period(from, to)).header("Authorization", TestTokens.admin())).andExpect(status().isOk())
				.andExpect(jsonPath("$.traffic.eventsByName.click_call").isNumber()).andExpect(jsonPath("$.traffic.viewsByDay").isArray())
				.andExpect(jsonPath("$.bookingRate").doesNotExist()).andReturn();

		String body = result.getResponse().getContentAsString();
		assertThat(Long.parseLong(body.replaceAll(".*\"visitors\":(\\d+).*", "$1"))).isGreaterThanOrEqualTo(visitors + 2);
		assertThat(Long.parseLong(body.replaceAll(".*\"views\":(\\d+).*", "$1"))).isGreaterThanOrEqualTo(3);
		assertThat(body).contains("\"unavailable\":[\"booking\",\"crm\",\"listing\"]");
	}

	private long visitors(Instant from, Instant to) throws Exception {
		String body = mvc.perform(get(PATH + period(from, to)).header("Authorization", TestTokens.admin())).andReturn().getResponse().getContentAsString();
		return Long.parseLong(body.replaceAll(".*\"visitors\":(\\d+).*", "$1"));
	}

	@Test
	void viewsAreGroupedPerDay() throws Exception {
		Instant at = Instant.now().truncatedTo(ChronoUnit.SECONDS).minusSeconds(5);
		event("view", "s-" + UUID.randomUUID(), at);
		event("view", "s-" + UUID.randomUUID(), at);

		mvc.perform(get(PATH + period(at.minus(1, ChronoUnit.HOURS), at.plus(1, ChronoUnit.HOURS))).header("Authorization", TestTokens.admin()))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.traffic.viewsByDay[?(@.day=='" + at.atZone(java.time.ZoneOffset.UTC).toLocalDate() + "')].count").isNotEmpty());
	}

	@Test
	void theExcelFileOpensAndShowsTheUnavailableParts() throws Exception {
		MvcResult result = mvc.perform(get(PATH + ".xlsx").header("Authorization", TestTokens.admin())).andExpect(status().isOk()).andReturn();

		assertThat(result.getResponse().getContentType()).isEqualTo("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
		assertThat(result.getResponse().getHeader("Content-Disposition")).contains("attachment").contains(".xlsx");
		try (XSSFWorkbook book = new XSSFWorkbook(new ByteArrayInputStream(result.getResponse().getContentAsByteArray()))) {
			assertThat(book.getNumberOfSheets()).isEqualTo(4);
			assertThat(book.getSheet("Overview").getRow(8).getCell(1).toString()).isEqualTo("booking, crm, listing");
		}
	}

	@Test
	void aTooLongOrReversedPeriodIsRefused() throws Exception {
		Instant now = Instant.now();

		mvc.perform(get(PATH + period(now, now.minus(1, ChronoUnit.DAYS))).header("Authorization", TestTokens.admin())).andExpect(status().isBadRequest());
		mvc.perform(get(PATH + period(now.minus(400, ChronoUnit.DAYS), now)).header("Authorization", TestTokens.admin())).andExpect(status().isBadRequest());
	}

}
