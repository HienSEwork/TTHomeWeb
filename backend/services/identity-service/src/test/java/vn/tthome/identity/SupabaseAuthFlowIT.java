package vn.tthome.identity;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.support.InMemoryMessageSender;
import vn.tthome.identity.support.MutableClock;

/**
 * End-to-end flow on the dev-only Supabase database with random accounts that are deleted afterwards. It never
 * reads or changes rows it did not create. Run on request only: ./mvnw -pl services/identity-service -am -Psupabase test
 */
@Tag("supabase")
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("supabase")
class SupabaseAuthFlowIT {

	private static final String PASSWORD = "correct-horse-battery";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;
	@Autowired
	InMemoryMessageSender sender;
	@Autowired
	MutableClock clock;

	private final List<String> phones = new ArrayList<>();
	private final List<String> emails = new ArrayList<>();

	@AfterEach
	void cleanUp() {
		for (String phone : phones) {
			jdbc.sql("delete from identity.user_account where phone = :p").param("p", phone).update();
			jdbc.sql("delete from identity.otp_challenge where target = :p").param("p", phone).update();
		}
		for (String email : emails) {
			jdbc.sql("delete from identity.user_account where lower(email) = :e").param("e", email).update();
			jdbc.sql("delete from identity.otp_challenge where target = :e").param("e", email).update();
		}
	}

	private ResultActions postJson(String path, String json) throws Exception {
		return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json)
				.with(request -> {
					request.setRemoteAddr("203.0.113." + (int) (Math.random() * 200 + 1));
					return request;
				}));
	}

	private static String field(String json, String name) {
		return json.replaceAll(".*\"" + name + "\":\"([^\"]+)\".*", "$1");
	}

	@Test
	void phoneAndEmailAccountsRegisterSignInRefreshAndSignOut() throws Exception {
		String phone = "09" + String.format("%08d", (long) (Math.random() * 100_000_000L));
		String e164 = "+84" + phone.substring(1);
		phones.add(e164);
		postJson("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}").andExpect(status().isAccepted());
		String code = sender.lastCode(e164, OtpPurpose.REGISTER);
		String registered = postJson("/api/v1/auth/register/phone/verify",
				"{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();

		String loggedIn = postJson("/api/v1/auth/login",
				"{\"identifier\":\"" + phone + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + field(loggedIn, "accessToken")))
				.andExpect(status().isOk());
		String refreshed = postJson("/api/v1/auth/refresh",
				"{\"refreshToken\":\"" + field(loggedIn, "refreshToken") + "\"}")
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
		postJson("/api/v1/auth/logout", "{\"refreshToken\":\"" + field(refreshed, "refreshToken") + "\"}")
				.andExpect(status().isNoContent());
		postJson("/api/v1/auth/refresh", "{\"refreshToken\":\"" + field(refreshed, "refreshToken") + "\"}")
				.andExpect(status().isUnauthorized());
		assertThat(field(registered, "accessToken")).isNotBlank();

		String email = "supabase-it-" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
		emails.add(email);
		clock.advance(Duration.ofSeconds(61));
		postJson("/api/v1/auth/register/email", "{\"email\":\"" + email + "\"}").andExpect(status().isAccepted());
		postJson("/api/v1/auth/login", "{\"identifier\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isUnauthorized());
		postJson("/api/v1/auth/register/email/verify", "{\"email\":\"" + email + "\",\"code\":\""
				+ sender.lastCode(email, OtpPurpose.REGISTER) + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk());
		postJson("/api/v1/auth/login", "{\"identifier\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk());
	}

}
