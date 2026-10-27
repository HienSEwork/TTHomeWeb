package vn.tthome.consignment.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.consignment.ConsignmentIntegrationTestBase;
import vn.tthome.consignment.support.TestTokens;

/** The submission figures against a real PostgreSQL. The database is shared, so the checks are on differences. */
@AutoConfigureMockMvc
class AdminSubmissionStatsTests extends ConsignmentIntegrationTestBase {

	private static final String PATH = "/api/v1/admin/stats/submissions";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private long figure(String field) throws Exception {
		String body = mvc.perform(get(PATH).header("Authorization", TestTokens.admin())).andExpect(status().isOk()).andReturn().getResponse()
				.getContentAsString();
		return Long.parseLong(body.replaceAll(".*\"" + field + "\":(\\d+).*", "$1"));
	}

	private void insert(String status) {
		jdbc.sql("insert into consignment.submission (id, code, landlord_name, landlord_phone, address_text, status) values (gen_random_uuid(), "
				+ ":code, 'L', '0912345678', 'A', :status)").param("code", "KS-" + java.util.UUID.randomUUID()).param("status", status).update();
	}

	@Test
	void theCountsFollowTheSubmissions() throws Exception {
		long total = figure("total");
		long pending = figure("pendingReview");
		insert("submitted");
		insert("submitted");
		insert("need_info");
		insert("approved");

		org.assertj.core.api.Assertions.assertThat(figure("total")).isEqualTo(total + 4);
		org.assertj.core.api.Assertions.assertThat(figure("pendingReview")).isEqualTo(pending + 2);
	}

}
