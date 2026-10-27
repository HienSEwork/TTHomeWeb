package vn.tthome.crm.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;
import vn.tthome.crm.models.dtos.CollaboratorSummary;
import vn.tthome.crm.models.dtos.CommissionResponse;
import vn.tthome.crm.services.commission.CommissionService;
import vn.tthome.crm.support.TestTokens;

@WebMvcTest(CommissionController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class CommissionControllerWebTest {

	private static final String BASE = "/api/v1/admin/crm";
	private static final UUID ID = UUID.randomUUID();
	private static final String CREATE = "{\"customerId\":\"" + UUID.randomUUID() + "\",\"amount\":500000,\"note\":\"x\"}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	CommissionService commissions;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static CommissionResponse sample() {
		return new CommissionResponse(ID, UUID.randomUUID(), UUID.randomUUID(), 500_000L, "pending", null, null, null, null);
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		List<MockHttpServletRequestBuilder> all = List.of(get(BASE + "/collaborators"), get(BASE + "/commissions"),
				get(BASE + "/commissions/" + ID), json(post(BASE + "/commissions"), CREATE),
				json(put(BASE + "/commissions/" + ID), "{\"amount\":1}"), json(put(BASE + "/commissions/" + ID + "/status"), "{\"status\":\"paid\"}"));
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("AGENT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(commissions);
	}

	@Test
	void collaboratorsAndCommissionsAreListedWithTheirFilters() throws Exception {
		UUID referrer = UUID.randomUUID();
		when(commissions.collaborators(null, 0, 20))
				.thenReturn(new PageResponse<>(List.of(new CollaboratorSummary(referrer, 4, 2, 100, 200)), 0, 20, 1));
		when(commissions.list(null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(sample()), 0, 20, 1));
		when(commissions.list(referrer, null, "paid", 1, 5)).thenReturn(new PageResponse<>(List.of(), 1, 5, 0));

		asAdmin(get(BASE + "/collaborators")).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].customers").value(4))
				.andExpect(jsonPath("$.items[0].commissionPaid").value(200));
		asAdmin(get(BASE + "/commissions")).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].amount").value(500000));
		asAdmin(get(BASE + "/commissions?referrerUserId=" + referrer + "&status=paid&page=1&size=5")).andExpect(status().isOk());
		for (String query : List.of("referrerUserId=abc", "customerId=abc", "page=-1", "size=0", "size=101", "status=" + "x".repeat(17))) {
			asAdmin(get(BASE + "/commissions?" + query)).andExpect(status().isBadRequest());
		}
		asAdmin(get(BASE + "/collaborators?size=101")).andExpect(status().isBadRequest());
	}

	@Test
	void creatingAndEditingValidateTheirBodies() throws Exception {
		when(commissions.create(any(UUID.class), any())).thenReturn(sample());
		when(commissions.update(eq(ID), any())).thenReturn(sample());
		when(commissions.setStatus(eq(ID), any())).thenReturn(sample());

		asAdmin(json(post(BASE + "/commissions"), CREATE)).andExpect(status().isCreated());
		asAdmin(json(put(BASE + "/commissions/" + ID), "{\"amount\":0}")).andExpect(status().isOk());
		for (String status : List.of("approved", "paid", "cancelled")) {
			asAdmin(json(put(BASE + "/commissions/" + ID + "/status"), "{\"status\":\"" + status + "\"}")).andExpect(status().isOk());
		}
		for (String body : List.of("{}", CREATE.replace("500000", "-1"), CREATE.replace("\"amount\":500000,", ""),
				"{\"amount\":1}", CREATE.replace("\"note\":\"x\"", "\"note\":\"" + "x".repeat(1001) + "\""))) {
			asAdmin(json(post(BASE + "/commissions"), body)).andExpect(status().isBadRequest());
		}
		for (String body : List.of("{}", "{\"amount\":-5}", "{\"amount\":null}")) {
			asAdmin(json(put(BASE + "/commissions/" + ID), body)).andExpect(status().isBadRequest());
		}
		for (String body : List.of("{}", "{\"status\":\"pending\"}", "{\"status\":\"refunded\"}")) {
			asAdmin(json(put(BASE + "/commissions/" + ID + "/status"), body)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void serviceErrorsKeepTheirStatus() throws Exception {
		when(commissions.get(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));
		when(commissions.setStatus(eq(ID), any())).thenThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "final"));

		asAdmin(get(BASE + "/commissions/" + ID)).andExpect(status().isNotFound());
		asAdmin(json(put(BASE + "/commissions/" + ID + "/status"), "{\"status\":\"paid\"}")).andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CONFLICT"));
	}

}
