package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.jwt.impl.JwtServiceImpl;
import vn.tthome.identity.services.session.SessionService;
import vn.tthome.identity.support.MutableClock;
import vn.tthome.identity.support.TestAuthProperties;

@AutoConfigureMockMvc
class RefreshEndpointTests extends IdentityIntegrationTestBase {

	@Autowired
	MockMvc mvc;
	@Autowired
	SessionService sessions;
	@Autowired
	UserAccountRepository users;

	@Test
	void refreshEndpointRotatesTheTokens() throws Exception {
		UserAccount user = new UserAccount();
		user.setPhone("+849" + String.format("%08d", (long) (Math.random() * 100_000_000L)));
		user = users.saveAndFlush(user);
		TokenPair first = sessions.issue(user, false, null, null);

		String body = mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"" + first.refreshToken() + "\"}"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andReturn().getResponse().getContentAsString();

		assertThat(body).doesNotContain(first.refreshToken());
		mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"" + first.refreshToken() + "\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
	}

	@Test
	void unknownTokenIs401AndMissingFieldIs400() throws Exception {
		mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"nope\"}"))
				.andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
		mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON).content("{}"))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	private TokenPair newSession() {
		UserAccount user = new UserAccount();
		user.setPhone("+849" + String.format("%08d", (long) (Math.random() * 100_000_000L)));
		return sessions.issue(users.saveAndFlush(user), false, null, null);
	}

	@Test
	void refreshWorksEvenWithAnExpiredBearerHeaderStillAttached() throws Exception {
		TokenPair pair = newSession();
		String expired = new JwtServiceImpl(TestAuthProperties.defaults(), new MutableClock(Instant.now().minus(Duration.ofHours(2))))
				.issueAccessToken(UUID.randomUUID(), UUID.randomUUID(), List.of("TENANT"));

		mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"" + pair.refreshToken() + "\"}")
				.header("Authorization", "Bearer " + expired))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty());
	}

	@Test
	void logoutWorksWithAGarbageBearerHeader() throws Exception {
		TokenPair pair = newSession();

		mvc.perform(post("/api/v1/auth/logout").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"" + pair.refreshToken() + "\"}")
				.header("Authorization", "Bearer not.a.token"))
				.andExpect(status().isNoContent());
	}

}
