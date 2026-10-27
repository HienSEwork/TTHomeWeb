package vn.tthome.common.security;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.tthome.common.error.GlobalExceptionHandler;

@SpringBootTest(classes = ResourceServerAutoConfigurationTest.TestApp.class,
		properties = "tthome.security.jwt-secret=" + AccessTokenParserTest.SECRET)
@AutoConfigureMockMvc
class ResourceServerAutoConfigurationTest {

	@Configuration
	@EnableAutoConfiguration(excludeName = { "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
			"org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration",
			"org.springframework.boot.amqp.autoconfigure.RabbitAutoConfiguration" })
	@Import({ Controllers.class, GlobalExceptionHandler.class })
	static class TestApp {
	}

	@RestController
	static class Controllers {

		@GetMapping("/api/who")
		String who(@AuthenticationPrincipal AccessClaims claims) {
			return claims.userId().toString();
		}

		@GetMapping("/api/admin")
		@PreAuthorize("hasRole('ADMIN')")
		String admin() {
			return "ok";
		}

	}

	@Autowired
	MockMvc mvc;

	private static String bearer(UUID user, String... roles) {
		return "Bearer " + AccessTokenParserTest.token(AccessTokenParserTest.SECRET, user, UUID.randomUUID(),
				List.of(roles), Instant.now().plus(Duration.ofMinutes(5)));
	}

	@Test
	void aRequestWithoutATokenIsUnauthorized() throws Exception {
		mvc.perform(get("/api/who")).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
	}

	@Test
	void aBadOrExpiredTokenIsUnauthorized() throws Exception {
		String expired = "Bearer " + AccessTokenParserTest.token(AccessTokenParserTest.SECRET, UUID.randomUUID(),
				UUID.randomUUID(), List.of("ADMIN"), Instant.now().minusSeconds(60));

		mvc.perform(get("/api/who").header("Authorization", expired)).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/who").header("Authorization", "Bearer garbage")).andExpect(status().isUnauthorized());
		mvc.perform(get("/api/who").header("Authorization", "Basic abc")).andExpect(status().isUnauthorized());
	}

	@Test
	void aValidTokenReachesTheControllerWithItsClaims() throws Exception {
		UUID user = UUID.randomUUID();

		mvc.perform(get("/api/who").header("Authorization", bearer(user, "TENANT"))).andExpect(status().isOk())
				.andExpect(content().string(user.toString()));
	}

	@Test
	void roleRestrictedMethodsAnswer403ToOtherRoles() throws Exception {
		mvc.perform(get("/api/admin").header("Authorization", bearer(UUID.randomUUID(), "CONSULTANT")))
				.andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
		mvc.perform(get("/api/admin").header("Authorization", bearer(UUID.randomUUID(), "ADMIN")))
				.andExpect(status().isOk());
	}

	@Test
	void theApiDocsPathIsNotBehindTheTokenCheck() throws Exception {
		// No springdoc in this test app, so the permitted path is simply unknown rather than unauthorized.
		mvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
	}

}
