package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.session.SessionService;

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

}
