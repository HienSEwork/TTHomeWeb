package vn.tthome.search.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.search.models.dtos.ListingItemResponse;
import vn.tthome.search.models.dtos.NearbyItemResponse;
import vn.tthome.search.models.dtos.NearbyResponse;
import vn.tthome.search.models.dtos.SuggestItemResponse;
import vn.tthome.search.services.nearby.NearbyService;
import vn.tthome.search.services.similar.SimilarRoomService;
import vn.tthome.search.services.suggest.SuggestService;

@WebMvcTest({ NearbyController.class, SuggestController.class, SimilarController.class })
@Import(GlobalExceptionHandler.class)
class NearbySuggestSimilarControllerTests {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	NearbyService nearby;

	@MockitoBean
	SuggestService suggest;

	@MockitoBean
	SimilarRoomService similar;

	private static ListingItemResponse item() {
		return new ListingItemResponse(UUID.randomUUID(), "room-1", "Minihouse", "addr", "duplex", 2_600_000L, true,
				25.0, "full", false, true, false, false, "allowed", false, List.of(), "http://img", 10.03, 105.77, null);
	}

	@Test
	void nearbyReturnsDistanceInSnakeCase() throws Exception {
		when(nearby.nearby(eq(10.03), eq(105.77), eq(2000), any(), any()))
				.thenReturn(new NearbyResponse(1, List.of(new NearbyItemResponse(0.3, item()))));

		mvc.perform(get("/api/v1/nearby").param("lat", "10.03").param("lng", "105.77").param("radius_m", "2000"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].distance_km").value(0.3))
				.andExpect(jsonPath("$.items[0].room.room_slug").value("room-1"));
	}

	@Test
	void nearbyInvalidInputIs400() throws Exception {
		when(nearby.nearby(any(), any(), any(), any(), any()))
				.thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "bad"));

		mvc.perform(get("/api/v1/nearby")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void suggestReturnsProjects() throws Exception {
		when(suggest.suggest("hem")).thenReturn(List.of(new SuggestItemResponse("P1", "Minihouse", 3)));

		mvc.perform(get("/api/v1/suggest").param("q", "hem")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].project_code").value("P1"))
				.andExpect(jsonPath("$[0].room_count").value(3));
	}

	@Test
	void similarReturnsRoomsAndUnknownRoomIs404() throws Exception {
		UUID id = UUID.randomUUID();
		UUID missing = UUID.randomUUID();
		when(similar.similar(id)).thenReturn(List.of(item()));
		when(similar.similar(missing)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "room not found"));

		mvc.perform(get("/api/v1/rooms/{id}/similar", id)).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].room_slug").value("room-1"));
		mvc.perform(get("/api/v1/rooms/{id}/similar", missing)).andExpect(status().isNotFound());
	}

}
