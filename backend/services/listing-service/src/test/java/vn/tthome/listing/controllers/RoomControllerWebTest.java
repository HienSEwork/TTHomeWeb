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

import java.math.BigDecimal;
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
import vn.tthome.listing.models.dtos.RoomAvailabilityRequest;
import vn.tthome.listing.models.dtos.RoomRequest;
import vn.tthome.listing.models.dtos.RoomResponse;
import vn.tthome.listing.services.room.RoomService;
import vn.tthome.listing.support.TestTokens;

/** Routing, validation, authorization and error mapping of the room endpoints, with the service mocked. */
@WebMvcTest(RoomController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class RoomControllerWebTest {

	private static final UUID PROJECT = UUID.randomUUID();
	private static final UUID ROOM = UUID.randomUUID();
	private static final String ROOMS = "/api/v1/admin/projects/" + PROJECT + "/rooms";
	private static final String BODY = "{\"code\":\"101\",\"title\":\"Sunny\",\"roomType\":\"studio\",\"price\":4000000}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	RoomService rooms;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static RoomResponse room() {
		return new RoomResponse(ROOM, PROJECT, "101", "Sunny", "sunny-101", "studio", null, new BigDecimal("20.5"),
				4_000_000L, false, null, null, null, null, null, "available", null, false, null, null, List.of());
	}

	private static List<MockHttpServletRequestBuilder> everyEndpoint() {
		return List.of(get(ROOMS), json(post(ROOMS), BODY), get("/api/v1/admin/rooms/" + ROOM),
				json(put("/api/v1/admin/rooms/" + ROOM), BODY),
				json(put("/api/v1/admin/rooms/" + ROOM + "/availability"), "{\"price\":1}"),
				json(put("/api/v1/admin/rooms/" + ROOM + "/amenities"), "{\"amenityIds\":[]}"),
				delete("/api/v1/admin/rooms/" + ROOM));
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("TENANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(rooms);
	}

	@Test
	void listUsesDefaultsAndPassesFilters() throws Exception {
		when(rooms.list(PROJECT, null, null, 0, 50)).thenReturn(new PageResponse<>(List.of(room()), 0, 50, 1));
		when(rooms.list(PROJECT, "rented", "101", 1, 10)).thenReturn(new PageResponse<>(List.of(), 1, 10, 0));

		asAdmin(get(ROOMS)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].slug").value("sunny-101"))
				.andExpect(jsonPath("$.items[0].areaM2").value(20.5));
		asAdmin(get(ROOMS + "?status=rented&q=101&page=1&size=10")).andExpect(status().isOk());
		for (String query : List.of("page=-1", "size=0", "size=201", "q=" + "x".repeat(101))) {
			asAdmin(get(ROOMS + "?" + query)).andExpect(status().isBadRequest());
		}
		asAdmin(get("/api/v1/admin/projects/not-a-uuid/rooms")).andExpect(status().isBadRequest());
	}

	@Test
	void createAnswers201AndRejectsInvalidBodies() throws Exception {
		when(rooms.create(eq(PROJECT), any(RoomRequest.class))).thenReturn(room());

		asAdmin(json(post(ROOMS), BODY)).andExpect(status().isCreated()).andExpect(jsonPath("$.status").value("available"));

		for (String body : List.of("{}", BODY.replace("101", ""), BODY.replace("Sunny", " "), BODY.replace("studio", "castle"),
				BODY.replace("}", ",\"floor\":201}"), BODY.replace("}", ",\"areaM2\":0}"),
				BODY.replace("}", ",\"furniture\":\"lots\"}"), BODY.replace("4000000", "-1"),
				BODY.replace("}", ",\"maxOccupants\":0}"), BODY.replace("}", ",\"availableFrom\":\"soon\"}"),
				BODY.replace("\"101\"", "\"" + "x".repeat(51) + "\""), "not json")) {
			asAdmin(json(post(ROOMS), body)).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		verify(rooms, org.mockito.Mockito.times(1)).create(eq(PROJECT), any(RoomRequest.class));
	}

	@Test
	void availabilityAcceptsAStatusAndOrAPriceAndRejectsBadValues() throws Exception {
		when(rooms.setAvailability(eq(ROOM), any(RoomAvailabilityRequest.class))).thenReturn(room());
		String path = "/api/v1/admin/rooms/" + ROOM + "/availability";

		asAdmin(json(put(path), "{\"status\":\"rented\"}")).andExpect(status().isOk());
		asAdmin(json(put(path), "{\"price\":5000000}")).andExpect(status().isOk());
		asAdmin(json(put(path), "{\"status\":\"hidden\",\"price\":1}")).andExpect(status().isOk());
		verify(rooms).setAvailability(ROOM, new RoomAvailabilityRequest("rented", null));

		for (String body : List.of("{\"status\":\"gone\"}", "{\"price\":-1}", "not json")) {
			asAdmin(json(put(path), body)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void updateAmenitiesAndDeleteDelegate() throws Exception {
		when(rooms.update(eq(ROOM), any(RoomRequest.class))).thenReturn(room());
		when(rooms.setAmenities(eq(ROOM), any())).thenReturn(room());
		UUID missing = UUID.randomUUID();
		when(rooms.get(missing)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));
		doThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "dup")).when(rooms).delete(missing);

		asAdmin(json(put("/api/v1/admin/rooms/" + ROOM), BODY)).andExpect(status().isOk());
		asAdmin(json(put("/api/v1/admin/rooms/" + ROOM + "/amenities"), "{\"amenityIds\":[1]}")).andExpect(status().isOk());
		asAdmin(json(put("/api/v1/admin/rooms/" + ROOM + "/amenities"), "{\"amenityIds\":null}"))
				.andExpect(status().isBadRequest());
		asAdmin(delete("/api/v1/admin/rooms/" + ROOM)).andExpect(status().isNoContent());
		verify(rooms).delete(ROOM);
		asAdmin(get("/api/v1/admin/rooms/" + missing)).andExpect(status().isNotFound());
		asAdmin(delete("/api/v1/admin/rooms/" + missing)).andExpect(status().isConflict());
	}

}
