package vn.tthome.identity.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.services.jwt.JwtService;
import vn.tthome.identity.services.jwt.impl.JwtServiceImpl;
import vn.tthome.identity.support.MutableClock;
import vn.tthome.identity.support.TestAuthProperties;

@AutoConfigureMockMvc
class SecurityConfigTests extends IdentityIntegrationTestBase {

	@Autowired
	MockMvc mvc;
	@Autowired
	JwtService jwt;

	@Test
	void unauthenticatedRequestToProtectedPathIs401WithApiError() throws Exception {
		mvc.perform(get("/api/v1/anything"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
	}

	@Test
	void validTokenReachesTheController() throws Exception {
		String token = jwt.issueAccessToken(UUID.randomUUID(), UUID.randomUUID(), List.of("TENANT"));

		mvc.perform(get("/api/v1/anything").header("Authorization", "Bearer " + token))
				.andExpect(status().isNotFound());
	}

	@Test
	void expiredTokenIs401() throws Exception {
		MutableClock past = new MutableClock(java.time.Instant.now().minus(Duration.ofHours(1)));
		String token = new JwtServiceImpl(TestAuthProperties.defaults(), past)
				.issueAccessToken(UUID.randomUUID(), UUID.randomUUID(), List.of("TENANT"));

		mvc.perform(get("/api/v1/anything").header("Authorization", "Bearer " + token))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
	}

	@Test
	void healthIsPublic() throws Exception {
		mvc.perform(get("/actuator/health")).andExpect(status().isOk());
	}

}
