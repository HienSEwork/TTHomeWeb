package vn.tthome.consignment.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;
import vn.tthome.consignment.models.dtos.SubmissionResponse;
import vn.tthome.consignment.services.submission.SubmissionService;
import vn.tthome.consignment.support.TestTokens;

/** Routing, validation, authorization and error mapping of the submission endpoints, with the service mocked. */
@WebMvcTest(SubmissionController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class SubmissionControllerWebTest {

	private static final String BASE = "/api/v1/admin/consignment/submissions";
	private static final UUID ID = UUID.randomUUID();

	@Autowired
	MockMvc mvc;
	@MockitoBean
	SubmissionService submissions;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static SubmissionResponse sample() {
		return new SubmissionResponse(ID, "KG-1", null, "Chu Nha", "0912345678", null, "12 Nguyen Hue", null, null, null, null, null,
				null, "submitted", null, null, null, null);
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		List<MockHttpServletRequestBuilder> all = List.of(get(BASE), get(BASE + "/" + ID),
				json(put(BASE + "/" + ID + "/review"), "{\"decision\":\"approve\"}"));
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("LANDLORD"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(submissions);
	}

	@Test
	void listParsesFiltersAndTheTimeRange() throws Exception {
		Instant from = Instant.parse("2026-07-01T00:00:00Z");
		Instant to = Instant.parse("2026-08-01T00:00:00Z");
		when(submissions.list(null, null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(sample()), 0, 20, 1));
		when(submissions.list("need_info", from, to, "nha", 1, 10)).thenReturn(new PageResponse<>(List.of(), 1, 10, 0));

		asAdmin(get(BASE)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].code").value("KG-1"));
		asAdmin(get(BASE + "?status=need_info&from=2026-07-01T00:00:00Z&to=2026-08-01T00:00:00Z&q=nha&page=1&size=10"))
				.andExpect(status().isOk());
		for (String query : List.of("from=yesterday", "to=2026-13-45", "page=-1", "size=0", "size=101", "q=" + "x".repeat(101))) {
			asAdmin(get(BASE + "?" + query)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void reviewAcceptsTheThreeDecisionsAndValidatesTheBody() throws Exception {
		when(submissions.review(any(UUID.class), eq(ID), any())).thenReturn(sample());

		for (String decision : List.of("approve", "reject", "need_info")) {
			asAdmin(json(put(BASE + "/" + ID + "/review"), "{\"decision\":\"" + decision + "\",\"note\":\"because\"}")).andExpect(status().isOk());
		}
		for (String body : List.of("{}", "{\"decision\":\"publish\"}", "{\"decision\":\"approved\"}", "{\"decision\":null}",
				"{\"decision\":\"reject\",\"note\":\"" + "x".repeat(2001) + "\"}", "not json")) {
			asAdmin(json(put(BASE + "/" + ID + "/review"), body)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void serviceErrorsKeepTheirStatus() throws Exception {
		when(submissions.get(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));
		when(submissions.review(any(UUID.class), eq(ID), any())).thenThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "final"));

		asAdmin(get(BASE + "/" + ID)).andExpect(status().isNotFound());
		asAdmin(json(put(BASE + "/" + ID + "/review"), "{\"decision\":\"approve\"}")).andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CONFLICT"));
		asAdmin(get(BASE + "/not-a-uuid")).andExpect(status().isBadRequest());
	}

}
