package vn.tthome.common.error;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

class GlobalExceptionHandlerTest {

	record Payload(@NotBlank String name) {
	}

	@RestController
	static class ThrowawayController {

		@PostMapping("/locked")
		void locked() {
			throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED", "Account is locked");
		}

		@GetMapping("/missing-resource")
		void missing() throws Exception {
			throw new org.springframework.web.servlet.resource.NoResourceFoundException(
					org.springframework.http.HttpMethod.GET, "/missing-resource", "missing-resource");
		}

		@GetMapping("/typed/{id}")
		void typed(@PathVariable java.util.UUID id) {
		}

		@PostMapping("/boom")
		void boom() {
			throw new IllegalStateException("secret internal detail");
		}

		@PostMapping("/validate")
		void validate(@Valid @RequestBody Payload payload) {
		}

	}

	private MockMvc mvc;

	@BeforeEach
	void setUp() {
		mvc = MockMvcBuilders.standaloneSetup(new ThrowawayController())
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
	}

	@Test
	void apiExceptionBecomesItsStatusAndCode() throws Exception {
		mvc.perform(post("/locked"))
				.andExpect(status().isLocked())
				.andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"))
				.andExpect(jsonPath("$.message").value("Account is locked"));
	}

	@Test
	void malformedJsonIs400ValidationError() throws Exception {
		mvc.perform(post("/validate").contentType(MediaType.APPLICATION_JSON).content("{not json"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void missingRequiredFieldIs400ValidationError() throws Exception {
		mvc.perform(post("/validate").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void unexpectedExceptionIs500WithoutDetails() throws Exception {
		String body = mvc.perform(post("/boom"))
				.andExpect(status().isInternalServerError())
				.andExpect(jsonPath("$.code").value("INTERNAL_ERROR"))
				.andReturn().getResponse().getContentAsString();

		assertThat(body).doesNotContain("secret internal detail").doesNotContain("IllegalStateException");
	}

	@Test
	void unsupportedMethodKeepsItsFrameworkStatus() throws Exception {
		mvc.perform(get("/locked"))
				.andExpect(status().isMethodNotAllowed())
				.andExpect(jsonPath("$.code").value("METHOD_NOT_ALLOWED"));
	}

	@Test
	void missingResourceIs404NotFound() throws Exception {
		mvc.perform(get("/missing-resource"))
				.andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	@Test
	void pathVariableOfTheWrongTypeIs400ValidationError() throws Exception {
		mvc.perform(get("/typed/not-a-uuid"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

}
