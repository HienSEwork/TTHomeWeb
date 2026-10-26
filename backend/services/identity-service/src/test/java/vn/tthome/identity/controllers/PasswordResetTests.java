package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.support.InMemoryMessageSender;
import vn.tthome.identity.support.MutableClock;

@AutoConfigureMockMvc
class PasswordResetTests extends IdentityIntegrationTestBase {

	private static final String PASSWORD = "correct-horse-battery";
	private static final String NEW_PASSWORD = "brand-new-password-2";
	private static final AtomicInteger COUNTER = new AtomicInteger(13000);

	@Autowired
	MockMvc mvc;
	@Autowired
	InMemoryMessageSender sender;
	@Autowired
	MutableClock clock;

	private static String ip() {
		return "198.19.0." + (COUNTER.incrementAndGet() % 250 + 1);
	}

	private static RequestPostProcessor fromIp(String ip) {
		return request -> {
			request.setRemoteAddr(ip);
			return request;
		};
	}

	private ResultActions postJson(String path, String json) throws Exception {
		return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json).with(fromIp(ip())));
	}

	private static String field(String json, String name) {
		return json.replaceAll(".*\"" + name + "\":\"([^\"]+)\".*", "$1");
	}

	private static String newPhone() {
		return "09" + String.format("%08d", 40_000_000 + COUNTER.incrementAndGet() * 17);
	}

	/** Phone account with a password; returns the login response body. */
	private String phoneAccount(String phone) throws Exception {
		postJson("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}").andExpect(status().isAccepted());
		String code = sender.lastCode("+84" + phone.substring(1), OtpPurpose.REGISTER);
		return postJson("/api/v1/auth/register/phone/verify",
				"{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
	}

	private ResultActions login(String identifier, String password) throws Exception {
		return postJson("/api/v1/auth/login", "{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}");
	}

	private String forgot(String identifier, String target) throws Exception {
		clock.advance(Duration.ofSeconds(61));
		postJson("/api/v1/auth/password/forgot", "{\"identifier\":\"" + identifier + "\"}").andExpect(status().isAccepted());
		return sender.lastCode(target, OtpPurpose.RESET_PASSWORD);
	}

	private ResultActions reset(String identifier, String code, String newPassword) throws Exception {
		return postJson("/api/v1/auth/password/reset",
				"{\"identifier\":\"" + identifier + "\",\"code\":\"" + code + "\",\"newPassword\":\"" + newPassword + "\"}");
	}

	@Test
	void forgotForUnknownIdentifierAnswers202AndSendsNothing() throws Exception {
		String phone = newPhone();

		postJson("/api/v1/auth/password/forgot", "{\"identifier\":\"" + phone + "\"}").andExpect(status().isAccepted());
		postJson("/api/v1/auth/password/forgot", "{\"identifier\":\"nobody" + UUID.randomUUID() + "@example.com\"}")
				.andExpect(status().isAccepted());

		assertThat(sender.sendCount("+84" + phone.substring(1))).isZero();
	}

	@Test
	void resetWithCorrectCodeChangesPasswordAndRevokesSessions() throws Exception {
		String phone = newPhone();
		String session = phoneAccount(phone);
		String code = forgot(phone, "+84" + phone.substring(1));

		reset(phone, code, NEW_PASSWORD).andExpect(status().isNoContent());

		login(phone, PASSWORD).andExpect(status().isUnauthorized());
		login(phone, NEW_PASSWORD).andExpect(status().isOk());
		postJson("/api/v1/auth/refresh", "{\"refreshToken\":\"" + field(session, "refreshToken") + "\"}")
				.andExpect(status().isUnauthorized());
	}

	@Test
	void resetClearsAnActiveLockout() throws Exception {
		String phone = newPhone();
		phoneAccount(phone);
		for (int i = 0; i < 5; i++) {
			login(phone, "wrong-password-" + i).andExpect(status().isUnauthorized());
		}
		login(phone, PASSWORD).andExpect(status().isLocked());
		String code = forgot(phone, "+84" + phone.substring(1));

		reset(phone, code, NEW_PASSWORD).andExpect(status().isNoContent());

		login(phone, NEW_PASSWORD).andExpect(status().isOk());
	}

	@Test
	void resetByEmailVerifiesTheAddressAndLetsTheUserIn() throws Exception {
		String email = "reset" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
		postJson("/api/v1/auth/register/email",
				"{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}").andExpect(status().isAccepted());
		String code = forgot(email, email);

		reset(email, code, NEW_PASSWORD).andExpect(status().isNoContent());

		login(email, NEW_PASSWORD).andExpect(status().isOk());
	}

	@Test
	void sixthOtpRequestInAnHourIs429() throws Exception {
		String phone = newPhone();
		for (int i = 0; i < 5; i++) {
			forgot(phone, "+84" + phone.substring(1));
		}
		clock.advance(Duration.ofSeconds(61));

		postJson("/api/v1/auth/password/forgot", "{\"identifier\":\"" + phone + "\"}")
				.andExpect(status().isTooManyRequests())
				.andExpect(jsonPath("$.code").value("OTP_RATE_LIMITED"));
	}

	@Test
	void resetWithWrongCodeIs400OtpInvalid() throws Exception {
		String phone = newPhone();
		phoneAccount(phone);
		String code = forgot(phone, "+84" + phone.substring(1));
		String wrong = code.equals("000000") ? "111111" : "000000";

		reset(phone, wrong, NEW_PASSWORD).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("OTP_INVALID"));
		login(phone, PASSWORD).andExpect(status().isOk());
	}

	@Test
	void resetWithTooShortPasswordIs400() throws Exception {
		String phone = newPhone();
		phoneAccount(phone);
		String code = forgot(phone, "+84" + phone.substring(1));

		reset(phone, code, "short").andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		login(phone, PASSWORD).andExpect(status().isOk());
	}

}
