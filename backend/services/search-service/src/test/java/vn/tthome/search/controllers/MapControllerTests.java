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
import vn.tthome.search.models.dtos.MapPinResponse;
import vn.tthome.search.models.dtos.MapResponse;
import vn.tthome.search.services.map.MapService;

@WebMvcTest(MapController.class)
@Import(GlobalExceptionHandler.class)
class MapControllerTests {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	MapService map;

	@Test
	void returnsPinsInSnakeCase() throws Exception {
		MapPinResponse pin = new MapPinResponse(UUID.randomUUID(), 10.0315, 105.7665, 2_600_000L, "2,6 tr", "Minihouse",
				"Minihouse", "room-1", "http://img", "duplex", false, "allowed");
		when(map.pins(eq("105.70,10.00,105.80,10.08"), any(), any())).thenReturn(new MapResponse(1, List.of(pin)));

		mvc.perform(get("/api/v1/map").param("bbox", "105.70,10.00,105.80,10.08").param("price_max", "3000000"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total_pins").value(1))
				.andExpect(jsonPath("$.pins[0].price_label").value("2,6 tr"))
				.andExpect(jsonPath("$.pins[0].thumbnail_url").value("http://img"))
				.andExpect(jsonPath("$.pins[0].room_slug").value("room-1"));
	}

	@Test
	void invalidBboxIs400() throws Exception {
		when(map.pins(any(), any(), any())).thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "bad"));

		mvc.perform(get("/api/v1/map")).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

}
