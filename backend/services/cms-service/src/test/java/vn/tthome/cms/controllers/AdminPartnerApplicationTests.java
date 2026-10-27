package vn.tthome.cms.controllers;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.cms.CmsIntegrationTestBase;
import vn.tthome.cms.support.TestTokens;

@AutoConfigureMockMvc
class AdminPartnerApplicationTests extends CmsIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/cms/partner-applications";

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

	private UUID insert(String kind, String name, String status, String position) {
		UUID id = UUID.randomUUID();
		jdbc.sql("insert into cms.partner_application (id, kind, full_name, phone, email, message, position, status) values (:id, :kind, "
				+ ":name, '0912345678', 'a@example.com', 'I know many landlords', :position, :status)").param("id", id)
				.param("kind", kind).param("name", name).param("position", position).param("status", status).update();
		return id;
	}

	@Test
	void anApplicationRoundTripsItsFields() throws Exception {
		UUID id = insert("ctv", "Applicant " + marker(), "new", null);

		asAdmin(get(BASE + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.kind").value("ctv"))
				.andExpect(jsonPath("$.phone").value("0912345678")).andExpect(jsonPath("$.email").value("a@example.com"))
				.andExpect(jsonPath("$.message").value("I know many landlords")).andExpect(jsonPath("$.status").value("new"))
				.andExpect(jsonPath("$.createdAt").isNotEmpty());
		asAdmin(get(BASE + "/" + UUID.randomUUID())).andExpect(status().isNotFound());
	}

	@Test
	void listFiltersByKindStatusAndTextNewestFirst() throws Exception {
		String m = marker();
		UUID first = insert("ctv", "First " + m, "new", null);
		UUID second = insert("job", "Second " + m, "contacted", "Consultant " + m);

		asAdmin(get(BASE + "?q=" + m.toUpperCase())).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].id").value(second.toString())).andExpect(jsonPath("$.items[1].id").value(first.toString()));
		asAdmin(get(BASE + "?q=" + m + "&kind=ctv")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?q=" + m + "&status=contacted")).andExpect(jsonPath("$.items[0].id").value(second.toString()));
		asAdmin(get(BASE + "?q=consultant " + m)).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?q=" + m + "&size=1&page=1")).andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.total").value(2));
	}

	@Test
	void anApplicationIsContactedThenApprovedAndThenFinal() throws Exception {
		UUID id = insert("ctv", "Flow " + marker(), "new", null);
		String status = BASE + "/" + id + "/status";

		asAdmin(json(put(status), "{\"status\":\"contacted\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("contacted"));
		asAdmin(json(put(status), "{\"status\":\"contacted\"}")).andExpect(status().isConflict());
		asAdmin(json(put(status), "{\"status\":\"approved\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("approved"));
		asAdmin(json(put(status), "{\"status\":\"rejected\"}")).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/" + UUID.randomUUID() + "/status"), "{\"status\":\"approved\"}")).andExpect(status().isNotFound());
	}

}
