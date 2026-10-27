package vn.tthome.identity.services.adminbootstrap;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.services.account.AccountService;

@AutoConfigureMockMvc
class AdminBootstrapServiceTests extends IdentityIntegrationTestBase {

	private static final String PASSWORD = "correct-horse-battery";

	@Autowired
	AdminBootstrapService bootstrap;
	@Autowired
	AccountService accounts;
	@Autowired
	JdbcClient jdbc;
	@Autowired
	MockMvc mvc;

	/** Other test classes share the database and promote their own admins: start from "no admin yet". */
	@BeforeEach
	void noAdminYet() {
		jdbc.sql("delete from identity.user_role where role_id = (select id from identity.role where code = 'ADMIN')")
				.update();
	}

	private static String newEmail() {
		return "boot" + UUID.randomUUID().toString().substring(0, 8) + "@Example.com";
	}

	private List<String> rolesOf(String email) {
		return jdbc.sql("select r.code from identity.user_role ur join identity.role r on r.id = ur.role_id "
				+ "join identity.user_account u on u.id = ur.user_id where lower(u.email) = :e order by r.code")
				.param("e", email.toLowerCase()).query(String.class).list();
	}

	private String login(String email, String password) throws Exception {
		return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"identifier\":\"" + email + "\",\"password\":\"" + password + "\"}")
				.with(request -> {
					request.setRemoteAddr("198.51.100." + (1 + Math.abs(UUID.randomUUID().hashCode()) % 250));
					return request;
				})).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
	}

	@Test
	void createsTheFirstAdminWhoCanSignInAndIsAdmin() throws Exception {
		String email = newEmail();

		assertThat(bootstrap.ensureFirstAdmin(email, PASSWORD)).isTrue();

		assertThat(rolesOf(email)).contains("ADMIN");
		String token = login(email.toUpperCase(), PASSWORD).replaceAll(".*\"accessToken\":\"([^\"]+)\".*", "$1");
		mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.roles[?(@ == 'ADMIN')]").exists());
		assertThat(jdbc.sql("select email_verified_at is not null from identity.user_account where lower(email) = :e")
				.param("e", email.toLowerCase()).query(Boolean.class).single()).isTrue();
	}

	@Test
	void doesNothingWhenAnAdminAlreadyExists() {
		String first = newEmail();
		String second = newEmail();
		assertThat(bootstrap.ensureFirstAdmin(first, PASSWORD)).isTrue();

		assertThat(bootstrap.ensureFirstAdmin(second, PASSWORD)).isFalse();

		assertThat(accounts.findByEmail(second.toLowerCase())).isEmpty();
		assertThat(rolesOf(first)).contains("ADMIN");
	}

	@Test
	void promotesAnExistingAccountWithoutChangingItsPassword() throws Exception {
		String email = newEmail();
		accounts.createEmailAccount(email.toLowerCase(), "Existing User", "old-password-12");

		assertThat(bootstrap.ensureFirstAdmin(email, "new-password-34")).isTrue();

		assertThat(rolesOf(email)).contains("ADMIN", "TENANT");
		login(email, "old-password-12");
		mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"identifier\":\"" + email + "\",\"password\":\"new-password-34\"}"))
				.andExpect(status().isUnauthorized());
	}

	@Test
	void aMissingOrShortPasswordIsRejectedAndNothingIsCreated() {
		String email = newEmail();

		assertThatThrownBy(() -> bootstrap.ensureFirstAdmin(email, "short"))
				.isInstanceOf(IllegalArgumentException.class).hasMessageContaining("password");
		assertThatThrownBy(() -> bootstrap.ensureFirstAdmin(email, null))
				.isInstanceOf(IllegalArgumentException.class).hasMessageContaining("password");

		assertThat(accounts.findByEmail(email.toLowerCase())).isEmpty();
	}

	@Test
	void thePasswordMayBeRemovedOnceAnAdminExists() {
		assertThat(bootstrap.ensureFirstAdmin(newEmail(), PASSWORD)).isTrue();

		assertThat(bootstrap.ensureFirstAdmin(newEmail(), null)).isFalse();
	}

}
