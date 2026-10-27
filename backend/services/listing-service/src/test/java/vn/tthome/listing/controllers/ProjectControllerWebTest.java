package vn.tthome.listing.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.verify;
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
import vn.tthome.listing.models.dtos.ProjectRequest;
import vn.tthome.listing.models.dtos.ProjectResponse;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;
import vn.tthome.listing.services.project.ProjectService;
import vn.tthome.listing.support.TestTokens;

/** Routing, validation, authorization and error mapping of the project endpoints, with the service mocked. */
@WebMvcTest(ProjectController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class ProjectControllerWebTest {

	private static final String BASE = "/api/v1/admin/projects";
	private static final UUID ID = UUID.randomUUID();
	private static final String BODY = "{\"name\":\"Green\",\"petPolicy\":\"none\",\"exclusive\":false,\"evParking\":false}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	ProjectService projects;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static ProjectResponse project() {
		return new ProjectResponse(ID, "PRJ-x", "Green", "green", null, null, null, null, null, null, null, null,
				false, "none", false, null, null, null, null, null, null, null, null, null, null, null, "active", 0, 0,
				null, List.of());
	}

	private static List<MockHttpServletRequestBuilder> everyEndpoint() {
		return List.of(get(BASE), get(BASE + "/" + ID), json(post(BASE), BODY), json(put(BASE + "/" + ID), BODY),
				json(put(BASE + "/" + ID + "/status"), "{\"status\":\"hidden\"}"),
				json(put(BASE + "/" + ID + "/amenities"), "{\"amenityIds\":[]}"), delete(BASE + "/" + ID));
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(projects);
	}

	@Test
	void listUsesDefaultsAndPassesFilters() throws Exception {
		when(projects.list(null, null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(project()), 0, 20, 1));
		when(projects.list("green", "hidden", 5, 6, 2, 10)).thenReturn(new PageResponse<>(List.of(), 2, 10, 0));

		asAdmin(get(BASE)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].code").value("PRJ-x"));
		asAdmin(get(BASE + "?q=green&status=hidden&wardId=5&districtId=6&page=2&size=10")).andExpect(status().isOk());
	}

	@Test
	void listRejectsBadParameters() throws Exception {
		for (String query : List.of("page=-1", "size=0", "size=101", "wardId=abc", "q=" + "x".repeat(101))) {
			asAdmin(get(BASE + "?" + query)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(projects);
	}

	@Test
	void createAnswers201AndRejectsInvalidBodies() throws Exception {
		when(projects.create(any(ProjectRequest.class))).thenReturn(project());

		asAdmin(json(post(BASE), BODY)).andExpect(status().isCreated()).andExpect(jsonPath("$.slug").value("green"));

		for (String body : List.of("{}", BODY.replace("Green", ""), BODY.replace("none", "dog"),
				BODY.replace("}", ",\"lat\":91}"), BODY.replace("}", ",\"lng\":-181}"),
				BODY.replace("}", ",\"feeWater\":-1}"), BODY.replace("}", ",\"ownerUserId\":\"nope\"}"), "not json")) {
			asAdmin(json(post(BASE), body)).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
	}

	@Test
	void updateStatusAndAmenitiesDelegateAndValidate() throws Exception {
		when(projects.update(eq(ID), any(ProjectRequest.class))).thenReturn(project());
		when(projects.setStatus(ID, "hidden")).thenReturn(project());
		when(projects.setAmenities(eq(ID), any(SetAmenitiesRequest.class))).thenReturn(project());

		asAdmin(json(put(BASE + "/" + ID), BODY)).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + ID + "/status"), "{\"status\":\"hidden\"}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + ID + "/amenities"), "{\"amenityIds\":[1,2]}")).andExpect(status().isOk());
		verify(projects).setAmenities(ID, new SetAmenitiesRequest(List.of((short) 1, (short) 2)));

		for (String body : List.of("{}", "{\"status\":\"deleted\"}", "{\"status\":null}")) {
			asAdmin(json(put(BASE + "/" + ID + "/status"), body)).andExpect(status().isBadRequest());
		}
		for (String body : List.of("{}", "{\"amenityIds\":null}", "{\"amenityIds\":[null]}")) {
			asAdmin(json(put(BASE + "/" + ID + "/amenities"), body)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void deleteAnswers204AndMapsErrors() throws Exception {
		UUID busy = UUID.randomUUID();
		doThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "rooms")).when(projects).delete(busy);
		when(projects.get(busy)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));

		asAdmin(delete(BASE + "/" + ID)).andExpect(status().isNoContent());
		verify(projects).delete(ID);
		asAdmin(delete(BASE + "/" + busy)).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CONFLICT"));
		asAdmin(get(BASE + "/" + busy)).andExpect(status().isNotFound());
		asAdmin(get(BASE + "/not-a-uuid")).andExpect(status().isBadRequest());
	}

}
