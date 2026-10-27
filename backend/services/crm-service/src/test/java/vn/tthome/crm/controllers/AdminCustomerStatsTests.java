package vn.tthome.crm.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.crm.CrmIntegrationTestBase;
import vn.tthome.crm.support.TestTokens;

/** The customer figures against a real PostgreSQL, over a period no other test writes into. */
@AutoConfigureMockMvc
class AdminCustomerStatsTests extends CrmIntegrationTestBase {

	private static final String PATH = "/api/v1/admin/stats/customers";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private void customer(String source, String stage, Instant created, boolean deleted) {
		jdbc.sql("insert into crm.customer (id, full_name, source, stage, created_at, deleted_at) values (gen_random_uuid(), 'S', :source, :stage, "
				+ ":created, :deleted)").param("source", source).param("stage", stage).param("created", Timestamp.from(created))
				.param("deleted", deleted ? Timestamp.from(created) : null).update();
	}

	private void request(String status, Instant created) {
		jdbc.sql("insert into crm.consult_request (id, phone, status, created_at) values (gen_random_uuid(), '0912345678', :status, :created)")
				.param("status", status).param("created", Timestamp.from(created)).update();
	}

	@Test
	void customersAndRequestsCreatedInThePeriodAreCountedByGroup() throws Exception {
		Instant day = Instant.parse("2021-05-10T09:00:00Z");
		customer("web", "new", day, false);
		customer("web", "viewing", day.plusSeconds(60), false);
		customer("zalo", "new", day.plusSeconds(120), false);
		customer("zalo", "new", day.plusSeconds(180), true);
		customer("web", "new", day.plusSeconds(86_400 * 3L), false);
		request("new", day);
		request("done", day.plusSeconds(60));
		request("new", day.plusSeconds(86_400 * 3L));

		asAdmin(get(PATH + "?from=2021-05-10T00:00:00Z&to=2021-05-11T00:00:00Z")).andExpect(status().isOk())
				.andExpect(jsonPath("$.newCustomers").value(3)).andExpect(jsonPath("$.bySource.web").value(2))
				.andExpect(jsonPath("$.bySource.zalo").value(1)).andExpect(jsonPath("$.byStage.new").value(2))
				.andExpect(jsonPath("$.byStage.viewing").value(1)).andExpect(jsonPath("$.newConsultRequests").value(2))
				.andExpect(jsonPath("$.consultRequestsByStatus.new").value(1)).andExpect(jsonPath("$.consultRequestsByStatus.done").value(1));
		asAdmin(get(PATH + "?from=2021-05-20T00:00:00Z&to=2021-05-21T00:00:00Z")).andExpect(jsonPath("$.newCustomers").value(0));
		asAdmin(get(PATH + "?from=2021-05-11T00:00:00Z&to=2021-05-10T00:00:00Z")).andExpect(status().isBadRequest());
	}

}
