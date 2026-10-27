package vn.tthome.listing.controllers;

import static org.mockito.ArgumentMatchers.any;
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

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.AdminUnitCreateRequest;
import vn.tthome.listing.models.dtos.AdminUnitResponse;
import vn.tthome.listing.models.dtos.AmenityRequest;
import vn.tthome.listing.models.dtos.AmenityResponse;
import vn.tthome.listing.models.dtos.LandmarkResponse;
import vn.tthome.listing.services.adminunit.AdminUnitService;
import vn.tthome.listing.services.amenity.AmenityService;
import vn.tthome.listing.services.landmark.LandmarkService;
import vn.tthome.listing.support.TestTokens;

/** Routing, validation, authorization and error mapping of the catalog endpoints, with the services mocked. */
@WebMvcTest({ AdminUnitController.class, AmenityController.class, LandmarkController.class, RoomTypeController.class })
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@org.springframework.test.context.TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class CatalogControllersWebTest {

	private static final String BASE = "/api/v1/admin/catalog";
	private static final String JSON_UNIT = "{\"id\":760,\"parentId\":79,\"level\":2,\"scheme\":\"pre_2025\","
			+ "\"name\":\"Quan 1\",\"slug\":\"quan-1\",\"centerLat\":10.7,\"centerLng\":106.7}";
	private static final String JSON_AMENITY = "{\"code\":\"pool\",\"name\":\"Pool\",\"scope\":\"project\","
			+ "\"icon\":null,\"sortOrder\":3,\"filter\":true}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	AdminUnitService areas;
	@MockitoBean
	AmenityService amenities;
	@MockitoBean
	LandmarkService landmarks;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static List<MockHttpServletRequestBuilder> everyEndpoint() {
		return List.of(get(BASE + "/areas"), get(BASE + "/areas/760"), json(post(BASE + "/areas"), JSON_UNIT),
				json(put(BASE + "/areas/760"), "{\"name\":\"Q\",\"slug\":\"q\"}"), delete(BASE + "/areas/760"),
				get(BASE + "/amenities"), get(BASE + "/amenities/1"), json(post(BASE + "/amenities"), JSON_AMENITY),
				json(put(BASE + "/amenities/1"), JSON_AMENITY), delete(BASE + "/amenities/1"), get(BASE + "/landmarks"),
				get(BASE + "/landmarks/1"), delete(BASE + "/landmarks/1"), get(BASE + "/room-types"));
	}

	@Test
	void everyEndpointNeedsAToken() throws Exception {
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
		}
		verifyNoInteractions(areas, amenities, landmarks);
	}

	@Test
	void everyEndpointRefusesNonAdminTokens() throws Exception {
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("CONSULTANT", "TENANT")))
					.andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
		}
		verifyNoInteractions(areas, amenities, landmarks);
	}

	@Test
	void areasListPassesTheFiltersAndDefaults() throws Exception {
		when(areas.list(null, null, null, null, 0, 50)).thenReturn(new PageResponse<>(List.of(), 0, 50, 0));
		when(areas.list("post_2025", (short) 3, 760, "ben", 2, 10))
				.thenReturn(new PageResponse<>(List.of(new AdminUnitResponse(1, 760, (short) 3, "post_2025", "Ben", "ben",
						null, null)), 2, 10, 21));

		asAdmin(get(BASE + "/areas")).andExpect(status().isOk()).andExpect(jsonPath("$.size").value(50));
		asAdmin(get(BASE + "/areas?scheme=post_2025&level=3&parentId=760&q=ben&page=2&size=10"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.total").value(21))
				.andExpect(jsonPath("$.items[0].slug").value("ben"));
	}

	@Test
	void areasListRejectsBadParameters() throws Exception {
		for (String query : List.of("level=0", "level=4", "page=-1", "size=0", "size=201", "parentId=abc",
				"scheme=" + "x".repeat(17), "q=" + "x".repeat(101))) {
			asAdmin(get(BASE + "/areas?" + query)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(areas);
	}

	@Test
	void creatingAnAreaAnswers201WithTheCreatedUnit() throws Exception {
		when(areas.create(any(AdminUnitCreateRequest.class)))
				.thenReturn(new AdminUnitResponse(760, 79, (short) 2, "pre_2025", "Quan 1", "quan-1", 10.7, 106.7));

		asAdmin(json(post(BASE + "/areas"), JSON_UNIT)).andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(760)).andExpect(jsonPath("$.parentId").value(79));
	}

	@Test
	void creatingAnAreaRejectsInvalidBodies() throws Exception {
		for (String body : List.of("{}", JSON_UNIT.replace("\"id\":760", "\"id\":0"),
				JSON_UNIT.replace("\"level\":2", "\"level\":4"), JSON_UNIT.replace("pre_2025", "2024"),
				JSON_UNIT.replace("quan-1", "Quan 1"), JSON_UNIT.replace("quan-1", "-quan"),
				JSON_UNIT.replace("\"Quan 1\"", "\" \""), JSON_UNIT.replace("10.7", "91"),
				JSON_UNIT.replace("106.7", "-181"), "not json")) {
			asAdmin(json(post(BASE + "/areas"), body)).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		verifyNoInteractions(areas);
	}

	@Test
	void areaErrorsKeepTheirStatus() throws Exception {
		when(areas.get(1)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));
		doThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "children")).when(areas).delete(2);

		asAdmin(get(BASE + "/areas/1")).andExpect(status().isNotFound());
		asAdmin(delete(BASE + "/areas/2")).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CONFLICT"));
		asAdmin(delete(BASE + "/areas/3")).andExpect(status().isNoContent());
		verify(areas).delete(3);
		asAdmin(get(BASE + "/areas/abc")).andExpect(status().isBadRequest());
	}

	@Test
	void amenitiesAreListedCreatedUpdatedAndDeleted() throws Exception {
		AmenityResponse pool = new AmenityResponse((short) 14, "pool", "Pool", "project", null, (short) 3, true);
		when(amenities.list()).thenReturn(List.of(pool));
		when(amenities.create(any(AmenityRequest.class))).thenReturn(pool);
		when(amenities.update(org.mockito.ArgumentMatchers.eq((short) 14), any(AmenityRequest.class))).thenReturn(pool);

		asAdmin(get(BASE + "/amenities")).andExpect(status().isOk()).andExpect(jsonPath("$[0].code").value("pool"));
		asAdmin(json(post(BASE + "/amenities"), JSON_AMENITY)).andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(14));
		asAdmin(json(put(BASE + "/amenities/14"), JSON_AMENITY)).andExpect(status().isOk());
		asAdmin(delete(BASE + "/amenities/14")).andExpect(status().isNoContent());
		verify(amenities).delete((short) 14);
	}

	@Test
	void amenityBodiesAreValidated() throws Exception {
		for (String body : List.of("{}", JSON_AMENITY.replace("\"pool\"", "\"Pool Area\""),
				JSON_AMENITY.replace("project", "building"), JSON_AMENITY.replace("\"sortOrder\":3", "\"sortOrder\":-1"),
				JSON_AMENITY.replace("\"filter\":true", "\"filter\":null"), JSON_AMENITY.replace("\"Pool\"", "\"\""))) {
			asAdmin(json(post(BASE + "/amenities"), body)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(amenities);
	}

	@Test
	void landmarksAreListedAndTheirBodiesValidated() throws Exception {
		when(landmarks.list()).thenReturn(
				List.of(new LandmarkResponse((short) 1, "rmit", "RMIT", "university", 10.7, 106.7, 3000, (short) 1)));

		asAdmin(get(BASE + "/landmarks")).andExpect(status().isOk()).andExpect(jsonPath("$[0].kind").value("university"));
		for (String body : List.of("{}", "{\"code\":\"rmit\",\"name\":\"RMIT\",\"kind\":\"zoo\",\"radiusM\":3000,\"sortOrder\":1}",
				"{\"code\":\"rmit\",\"name\":\"RMIT\",\"kind\":\"mall\",\"radiusM\":0,\"sortOrder\":1}",
				"{\"code\":\"rmit\",\"name\":\"RMIT\",\"kind\":\"mall\",\"lat\":95,\"radiusM\":10,\"sortOrder\":1}")) {
			asAdmin(json(post(BASE + "/landmarks"), body)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void roomTypesAreAFixedReadOnlyList() throws Exception {
		asAdmin(get(BASE + "/room-types")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(8))
				.andExpect(jsonPath("$[0]").value("studio"));
		asAdmin(post(BASE + "/room-types")).andExpect(status().isMethodNotAllowed());
	}

}
