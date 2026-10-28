package vn.tthome.search.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.search.models.dtos.SearchResponse;
import vn.tthome.search.services.search.SearchService;

@WebMvcTest(SearchController.class)
@Import(GlobalExceptionHandler.class)
class SearchControllerTests {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	SearchService search;

	@Test
	void returnsSnakeCasePage() throws Exception {
		when(search.search(any())).thenReturn(new SearchResponse(List.of(), 1, 20, 0, 0));

		mvc.perform(get("/api/v1/search").param("price_max", "3000000").param("room_type", "duplex"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.total_pages").value(0))
				.andExpect(jsonPath("$.items").isArray());
	}

	@Test
	void mapsServiceValidationErrorTo400() throws Exception {
		when(search.search(any()))
				.thenThrow(new ApiException(org.springframework.http.HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "bad"));

		mvc.perform(get("/api/v1/search").param("limit", "999"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void rejectsNonNumericPrice() throws Exception {
		mvc.perform(get("/api/v1/search").param("price_max", "abc")).andExpect(status().isBadRequest());
	}

}
