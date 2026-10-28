package vn.tthome.report.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import vn.tthome.report.ReportIntegrationTestBase;
import vn.tthome.report.support.TestTokens;

/** The activity log against a real PostgreSQL: the inet column, the partitioned table and the filters. */
@AutoConfigureMockMvc
class AdminAuditLogTests extends ReportIntegrationTestBase {

	private static final String PATH = "/api/v1/admin/audit-logs";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private ResultActions record(UUID actor, String body) throws Exception {
		return mvc.perform(post(PATH).header("Authorization", TestTokens.bearerFor(actor, "ADMIN")).contentType(MediaType.APPLICATION_JSON).content(body));
	}

	private ResultActions list(String query) throws Exception {
		MockHttpServletRequestBuilder request = get(PATH + query).header("Authorization", TestTokens.admin());
		return mvc.perform(request);
	}

	private static String line(String action, String type, String id, String ip) {
		return "{\"action\":\"" + action + "\",\"entityType\":" + (type == null ? "null" : "\"" + type + "\"") + ",\"entityId\":"
				+ (id == null ? "null" : "\"" + id + "\"") + ",\"ip\":" + (ip == null ? "null" : "\"" + ip + "\"") + "}";
	}

	@Test
	void aLineIsStoredForTheCallerWithItsAddressAndComesBackNewestFirst() throws Exception {
		UUID actor = UUID.randomUUID();
		String marker = "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

		record(actor, line("POST /api/v1/admin/" + marker, marker, null, "203.0.113.9")).andExpect(status().isCreated());
		record(actor, line("PUT /api/v1/admin/" + marker + "/{id}", marker, "42", "2001:db8::1")).andExpect(status().isCreated());

		list("?actorId=" + actor).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].action").value("PUT /api/v1/admin/" + marker + "/{id}"))
				.andExpect(jsonPath("$.items[0].actorId").value(actor.toString())).andExpect(jsonPath("$.items[0].actorIp").value("2001:db8::1"))
				.andExpect(jsonPath("$.items[0].entityId").value("42")).andExpect(jsonPath("$.items[0].entityType").value(marker))
				.andExpect(jsonPath("$.items[0].createdAt").isNotEmpty()).andExpect(jsonPath("$.items[1].actorIp").value("203.0.113.9"))
				.andExpect(jsonPath("$.items[1].entityId").doesNotExist());
		assertThat(jdbc.sql("select count(*) from report.audit_log where actor_id = :id").param("id", actor).query(Integer.class).single()).isEqualTo(2);
	}

	@Test
	void anAddressThatIsNotAValidIpIsStoredAsUnknown() throws Exception {
		UUID actor = UUID.randomUUID();

		record(actor, line("POST /api/v1/admin/x", "x", null, "999.999.1.1")).andExpect(status().isCreated());
		record(actor, line("POST /api/v1/admin/x", "x", null, null)).andExpect(status().isCreated());

		list("?actorId=" + actor).andExpect(jsonPath("$.total").value(2)).andExpect(jsonPath("$.items[0].actorIp").doesNotExist())
				.andExpect(jsonPath("$.items[1].actorIp").doesNotExist());
	}

	@Test
	void theLogIsFilteredByActorResourceTextAndTime() throws Exception {
		UUID actor = UUID.randomUUID();
		UUID other = UUID.randomUUID();
		String marker = "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
		Instant before = Instant.now().minus(1, ChronoUnit.MINUTES);
		record(actor, line("DELETE /api/v1/admin/" + marker + "/{id}", marker, "1", "10.0.0.1")).andExpect(status().isCreated());
		record(actor, line("POST /api/v1/admin/other", "other", null, "10.0.0.1")).andExpect(status().isCreated());
		record(other, line("DELETE /api/v1/admin/" + marker + "/{id}", marker, "2", "10.0.0.2")).andExpect(status().isCreated());
		Instant after = Instant.now().plus(1, ChronoUnit.MINUTES);

		list("?entityType=" + marker).andExpect(jsonPath("$.total").value(2));
		list("?entityType=" + marker + "&actorId=" + actor).andExpect(jsonPath("$.total").value(1)).andExpect(jsonPath("$.items[0].entityId").value("1"));
		list("?actorId=" + actor + "&q=DELETE").andExpect(jsonPath("$.total").value(1));
		list("?actorId=" + actor + "&q=" + marker.substring(0, 4) + "_" + marker.substring(5)).andExpect(jsonPath("$.total").value(0));
		list("?actorId=" + actor + "&from=" + before + "&to=" + after).andExpect(jsonPath("$.total").value(2));
		list("?actorId=" + actor + "&from=" + after).andExpect(jsonPath("$.total").value(0));
		list("?actorId=" + actor + "&size=1&page=1").andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.total").value(2));
		list("?from=" + after + "&to=" + before).andExpect(status().isBadRequest());
	}

}
