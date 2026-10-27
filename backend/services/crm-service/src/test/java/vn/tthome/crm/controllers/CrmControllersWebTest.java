package vn.tthome.crm.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import vn.tthome.crm.models.dtos.ConsultRequestResponse;
import vn.tthome.crm.models.dtos.CustomerResponse;
import vn.tthome.crm.services.carehistory.CareHistoryService;
import vn.tthome.crm.services.consultrequest.ConsultRequestService;
import vn.tthome.crm.services.customer.CustomerService;
import vn.tthome.crm.support.TestTokens;

/** Routing, validation, authorization and error mapping of the customer and consultation endpoints. */
@WebMvcTest({ CustomerController.class, ConsultRequestController.class })
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class CrmControllersWebTest {

	private static final String CUSTOMERS = "/api/v1/admin/crm/customers";
	private static final String REQUESTS = "/api/v1/admin/crm/consult-requests";
	private static final UUID ID = UUID.randomUUID();
	private static final String CUSTOMER = "{\"fullName\":\"An\",\"phone\":\"0912345678\",\"email\":\"an@example.com\","
			+ "\"source\":\"web\",\"priority\":1}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	CustomerService customers;
	@MockitoBean
	CareHistoryService care;
	@MockitoBean
	ConsultRequestService requests;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static CustomerResponse sample() {
		return new CustomerResponse(ID, null, "An", "0912345678", null, null, "web", "new", null, null, null, (short) 1, null,
				null, null);
	}

	private static List<MockHttpServletRequestBuilder> everyEndpoint() {
		return List.of(get(CUSTOMERS), get(CUSTOMERS + "/" + ID), json(post(CUSTOMERS), CUSTOMER), json(put(CUSTOMERS + "/" + ID), CUSTOMER),
				json(put(CUSTOMERS + "/" + ID + "/stage"), "{\"stage\":\"contacted\"}"), json(put(CUSTOMERS + "/" + ID + "/owner"), "{}"),
				delete(CUSTOMERS + "/" + ID), get(CUSTOMERS + "/" + ID + "/interactions"),
				json(post(CUSTOMERS + "/" + ID + "/interactions"), "{\"kind\":\"call\",\"summary\":\"x\"}"), get(CUSTOMERS + "/" + ID + "/notes"),
				json(post(CUSTOMERS + "/" + ID + "/notes"), "{\"body\":\"x\"}"), get(REQUESTS), get(REQUESTS + "/" + ID),
				json(put(REQUESTS + "/" + ID + "/assignee"), "{}"), json(put(REQUESTS + "/" + ID + "/status"), "{\"status\":\"done\"}"));
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(customers, care, requests);
	}

	@Test
	void customerListPassesFiltersAndDefaults() throws Exception {
		UUID owner = UUID.randomUUID();
		when(customers.list(null, null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(sample()), 0, 20, 1));
		when(customers.list("viewing", owner, "web", "an", 2, 10)).thenReturn(new PageResponse<>(List.of(), 2, 10, 0));

		asAdmin(get(CUSTOMERS)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].stage").value("new"));
		asAdmin(get(CUSTOMERS + "?stage=viewing&ownerUserId=" + owner + "&source=web&q=an&page=2&size=10")).andExpect(status().isOk());
		for (String query : List.of("ownerUserId=abc", "page=-1", "size=0", "size=101", "q=" + "x".repeat(101))) {
			asAdmin(get(CUSTOMERS + "?" + query)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void validCustomersAreAcceptedAndCreateAnswers201() throws Exception {
		when(customers.create(any())).thenReturn(sample());
		when(customers.update(eq(ID), any())).thenReturn(sample());

		asAdmin(json(post(CUSTOMERS), CUSTOMER)).andExpect(status().isCreated());
		asAdmin(json(put(CUSTOMERS + "/" + ID), CUSTOMER)).andExpect(status().isOk());
	}

	@Test
	void invalidCustomersAreRejected() throws Exception {
		for (String body : List.of("{}", CUSTOMER.replace("An", " "), CUSTOMER.replace("0912345678", "abc"),
				CUSTOMER.replace("0912345678", "123"), CUSTOMER.replace("an@example.com", "not-an-email"), CUSTOMER.replace("web", "radio"),
				CUSTOMER.replace("\"priority\":1", "\"priority\":6"), CUSTOMER.replace("\"priority\":1", "\"priority\":-1"),
				CUSTOMER.replace("}", ",\"nextFollowupAt\":\"soon\"}"), CUSTOMER.replace("}", ",\"referrerUserId\":\"x\"}"))) {
			asAdmin(json(post(CUSTOMERS), body)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		verifyNoInteractions(customers);
	}

	@Test
	void stageOwnerInteractionAndNoteBodiesAreValidated() throws Exception {
		when(customers.setStage(any(), eq(ID), any())).thenReturn(sample());
		when(customers.assignOwner(any(), eq(ID), any())).thenReturn(sample());

		asAdmin(json(put(CUSTOMERS + "/" + ID + "/stage"), "{\"stage\":\"lost\",\"lostReason\":\"too dear\"}")).andExpect(status().isOk());
		asAdmin(json(put(CUSTOMERS + "/" + ID + "/owner"), "{\"userId\":\"" + UUID.randomUUID() + "\"}")).andExpect(status().isOk());
		asAdmin(json(put(CUSTOMERS + "/" + ID + "/owner"), "{\"userId\":null}")).andExpect(status().isOk());

		for (String body : List.of("{}", "{\"stage\":\"won\"}", "{\"stage\":\"lost\",\"lostReason\":\"" + "x".repeat(501) + "\"}")) {
			asAdmin(json(put(CUSTOMERS + "/" + ID + "/stage"), body)).andExpect(status().isBadRequest());
		}
		for (String body : List.of("{}", "{\"kind\":\"stage_change\",\"summary\":\"x\"}", "{\"kind\":\"call\"}", "{\"kind\":\"call\",\"summary\":\" \"}",
				"{\"kind\":\"call\",\"direction\":\"sideways\",\"summary\":\"x\"}", "{\"kind\":\"call\",\"summary\":\"" + "x".repeat(2001) + "\"}")) {
			asAdmin(json(post(CUSTOMERS + "/" + ID + "/interactions"), body)).andExpect(status().isBadRequest());
		}
		for (String body : List.of("{}", "{\"body\":\" \"}", "{\"body\":\"" + "x".repeat(5001) + "\"}")) {
			asAdmin(json(post(CUSTOMERS + "/" + ID + "/notes"), body)).andExpect(status().isBadRequest());
		}
		asAdmin(json(put(CUSTOMERS + "/" + ID + "/owner"), "{\"userId\":\"x\"}")).andExpect(status().isBadRequest());
	}

	@Test
	void consultRequestsPassFiltersAndValidateTheStatus() throws Exception {
		UUID staff = UUID.randomUUID();
		ConsultRequestResponse sample = new ConsultRequestResponse(ID, null, "An", "0912345678", null, null, null, null, "web", "new", null, null);
		when(requests.list(null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(sample), 0, 20, 1));
		when(requests.list("assigned", staff, "an", 1, 5)).thenReturn(new PageResponse<>(List.of(), 1, 5, 0));
		when(requests.assign(eq(ID), any())).thenReturn(sample);
		when(requests.setStatus(eq(ID), any())).thenReturn(sample);

		asAdmin(get(REQUESTS)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].channel").value("web"));
		asAdmin(get(REQUESTS + "?status=assigned&assignedTo=" + staff + "&q=an&page=1&size=5")).andExpect(status().isOk());
		asAdmin(json(put(REQUESTS + "/" + ID + "/assignee"), "{\"userId\":\"" + staff + "\"}")).andExpect(status().isOk());
		for (String status : List.of("contacted", "done", "spam")) {
			asAdmin(json(put(REQUESTS + "/" + ID + "/status"), "{\"status\":\"" + status + "\"}")).andExpect(status().isOk());
		}
		for (String body : List.of("{}", "{\"status\":\"new\"}", "{\"status\":\"assigned\"}", "{\"status\":\"gone\"}")) {
			asAdmin(json(put(REQUESTS + "/" + ID + "/status"), body)).andExpect(status().isBadRequest());
		}
		asAdmin(get(REQUESTS + "?assignedTo=abc")).andExpect(status().isBadRequest());
	}

	@Test
	void serviceErrorsKeepTheirStatus() throws Exception {
		when(customers.get(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));
		when(requests.get(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));

		asAdmin(get(CUSTOMERS + "/" + ID)).andExpect(status().isNotFound());
		asAdmin(get(REQUESTS + "/" + ID)).andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
		asAdmin(delete(CUSTOMERS + "/" + ID)).andExpect(status().isNoContent());
		asAdmin(get(CUSTOMERS + "/not-a-uuid")).andExpect(status().isBadRequest());
	}

}
