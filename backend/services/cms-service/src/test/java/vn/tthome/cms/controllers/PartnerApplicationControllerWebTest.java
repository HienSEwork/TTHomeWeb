package vn.tthome.cms.controllers;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.cms.models.dtos.PartnerApplicationResponse;
import vn.tthome.cms.services.partnerapplication.PartnerApplicationService;
import vn.tthome.cms.support.TestTokens;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;

@WebMvcTest(PartnerApplicationController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class PartnerApplicationControllerWebTest {

	private static final String BASE = "/api/v1/admin/cms/partner-applications";
	private static final UUID ID = UUID.randomUUID();

	@Autowired
	MockMvc mvc;
	@MockitoBean
	PartnerApplicationService applications;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static PartnerApplicationResponse sample() {
		return new PartnerApplicationResponse(ID, "ctv", "An", "0912345678", null, null, null, "new", null);
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		List<MockHttpServletRequestBuilder> all = List.of(get(BASE), get(BASE + "/" + ID),
				json(put(BASE + "/" + ID + "/status"), "{\"status\":\"approved\"}"));
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("AGENT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(applications);
	}

	@Test
	void listPassesFiltersAndStatusChangesAreValidated() throws Exception {
		when(applications.list(null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(sample()), 0, 20, 1));
		when(applications.list("ctv", "new", "an", 1, 5)).thenReturn(new PageResponse<>(List.of(), 1, 5, 0));
		when(applications.setStatus(eq(ID), org.mockito.ArgumentMatchers.any())).thenReturn(sample());

		asAdmin(get(BASE)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].kind").value("ctv"));
		asAdmin(get(BASE + "?kind=ctv&status=new&q=an&page=1&size=5")).andExpect(status().isOk());
		for (String status : List.of("contacted", "approved", "rejected")) {
			asAdmin(json(put(BASE + "/" + ID + "/status"), "{\"status\":\"" + status + "\"}")).andExpect(status().isOk());
		}
		for (String body : List.of("{}", "{\"status\":\"new\"}", "{\"status\":\"hired\"}")) {
			asAdmin(json(put(BASE + "/" + ID + "/status"), body)).andExpect(status().isBadRequest());
		}
		for (String query : List.of("page=-1", "size=0", "size=101", "kind=" + "x".repeat(9))) {
			asAdmin(get(BASE + "?" + query)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void serviceErrorsKeepTheirStatus() throws Exception {
		when(applications.get(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));

		asAdmin(get(BASE + "/" + ID)).andExpect(status().isNotFound());
		asAdmin(get(BASE + "/not-a-uuid")).andExpect(status().isBadRequest());
	}

}
