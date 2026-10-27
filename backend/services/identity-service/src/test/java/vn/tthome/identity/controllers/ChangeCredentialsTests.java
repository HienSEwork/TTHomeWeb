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
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.support.InMemoryMessageSender;
import vn.tthome.identity.support.MutableClock;

@AutoConfigureMockMvc
class ChangeCredentialsTests extends IdentityIntegrationTestBase {

	private static final String PASSWORD = "correct-horse-battery";
	private static final String NEW_PASSWORD = "brand-new-password-2";
	private static final AtomicInteger COUNTER = new AtomicInteger(17000);

	@Autowired
	MockMvc mvc;
	@Autowired
	InMemoryMessageSender sender;
	@Autowired
	MutableClock clock;
	@Autowired
	JdbcClient jdbc;

	private static String ip() {
		return "198.51.99." + (COUNTER.incrementAndGet() % 250 + 1);
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

	private ResultActions postAuthed(String path, String json, String accessToken) throws Exception {
		return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json)
				.header("Authorization", "Bearer " + accessToken).with(fromIp(ip())));
	}

	private static String field(String json, String name) {
		return json.replaceAll(".*\"" + name + "\":\"([^\"]+)\".*", "$1");
	}

	private static String newPhone() {
		return "09" + String.format("%08d", 50_000_000 + COUNTER.incrementAndGet() * 19);
	}

	private static String e164(String local) {
		return "+84" + local.substring(1);
	}

	private String registerPhone(String phone, String passwordOrNull) throws Exception {
		clock.advance(Duration.ofSeconds(61));
		postJson("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}").andExpect(status().isAccepted());
		String code = sender.lastCode(e164(phone), OtpPurpose.REGISTER);
		String pw = passwordOrNull == null ? "" : ",\"password\":\"" + passwordOrNull + "\"";
		return postJson("/api/v1/auth/register/phone/verify",
				"{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\"" + pw + "}")
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
	}

	private String login(String identifier, String password) throws Exception {
		return postJson("/api/v1/auth/login", "{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\"}")
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
	}

	private ResultActions refresh(String refreshToken) throws Exception {
		return postJson("/api/v1/auth/refresh", "{\"refreshToken\":\"" + refreshToken + "\"}");
	}

	private ResultActions requestPhoneChange(String access, String newPhone, String currentPassword) throws Exception {
		clock.advance(Duration.ofSeconds(61));
		return postAuthed("/api/v1/auth/contact/change/request", "{\"type\":\"PHONE\",\"newValue\":\"" + newPhone
				+ "\",\"currentPassword\":\"" + currentPassword + "\"}", access);
	}

	private ResultActions confirmPhoneChange(String access, String newPhone, String code) throws Exception {
		return postAuthed("/api/v1/auth/contact/change/confirm",
				"{\"type\":\"PHONE\",\"newValue\":\"" + newPhone + "\",\"code\":\"" + code + "\"}", access);
	}

	@Test
	void changePasswordRevokesOtherSessionsButKeepsTheCurrentOne() throws Exception {
		String phone = newPhone();
		registerPhone(phone, PASSWORD);
		String a = login(phone, PASSWORD);
		String b = login(phone, PASSWORD);

		postAuthed("/api/v1/auth/password/change",
				"{\"currentPassword\":\"" + PASSWORD + "\",\"newPassword\":\"" + NEW_PASSWORD + "\"}",
				field(a, "accessToken")).andExpect(status().isNoContent());

		refresh(field(b, "refreshToken")).andExpect(status().isUnauthorized());
		refresh(field(a, "refreshToken")).andExpect(status().isOk());
		postJson("/api/v1/auth/login", "{\"identifier\":\"" + phone + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isUnauthorized());
		login(phone, NEW_PASSWORD);
	}

	@Test
	void changePasswordWithWrongCurrentPasswordIs401() throws Exception {
		String phone = newPhone();
		registerPhone(phone, PASSWORD);
		String a = login(phone, PASSWORD);

		postAuthed("/api/v1/auth/password/change",
				"{\"currentPassword\":\"not-it-at-all\",\"newPassword\":\"" + NEW_PASSWORD + "\"}",
				field(a, "accessToken")).andExpect(status().isUnauthorized())
				.andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
		login(phone, PASSWORD);
	}

	@Test
	void changePasswordOnAnAccountWithoutPasswordIs409() throws Exception {
		String phone = newPhone();
		String session = registerPhone(phone, null);

		postAuthed("/api/v1/auth/password/change",
				"{\"currentPassword\":\"whatever-it-is\",\"newPassword\":\"" + NEW_PASSWORD + "\"}",
				field(session, "accessToken")).andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("PASSWORD_NOT_SET"));
	}

	@Test
	void changePhoneSendsOtpToTheNewNumberOnly() throws Exception {
		String phone = newPhone();
		String target = newPhone();
		String access = field(registerPhone(phone, PASSWORD), "accessToken");
		int oldSent = sender.sendCount(e164(phone));

		requestPhoneChange(access, target, PASSWORD).andExpect(status().isAccepted());

		assertThat(sender.sendCount(e164(target))).isEqualTo(1);
		assertThat(sender.sendCount(e164(phone))).isEqualTo(oldSent);
	}

	@Test
	void confirmChangeUpdatesPhoneAndMarksItVerified() throws Exception {
		String phone = newPhone();
		String target = newPhone();
		String access = field(registerPhone(phone, PASSWORD), "accessToken");
		requestPhoneChange(access, "0" + target.substring(1).replaceAll("(\\d{3})(\\d{3})(\\d+)", "$1 $2 $3"), PASSWORD)
				.andExpect(status().isAccepted());
		String code = sender.lastCode(e164(target), OtpPurpose.CHANGE_CONTACT);

		confirmPhoneChange(access, target, code).andExpect(status().isNoContent());

		login(target, PASSWORD);
		postJson("/api/v1/auth/login", "{\"identifier\":\"" + phone + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isUnauthorized());
		assertThat(jdbc.sql("select phone_verified_at is not null from identity.user_account where phone = :p")
				.param("p", e164(target)).query(Boolean.class).single()).isTrue();
	}

	@Test
	void confirmFailsWith409WhenAnotherAccountTookTheNumber() throws Exception {
		String phone = newPhone();
		String contested = newPhone();
		String access = field(registerPhone(phone, PASSWORD), "accessToken");
		requestPhoneChange(access, contested, PASSWORD).andExpect(status().isAccepted());
		String code = sender.lastCode(e164(contested), OtpPurpose.CHANGE_CONTACT);
		registerPhone(contested, PASSWORD);

		confirmPhoneChange(access, contested, code).andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CONTACT_TAKEN"));
	}

	@Test
	void changeToAnAlreadyUsedEmailAnswers202ButNeverChangesAnything() throws Exception {
		String email = "taken" + UUID.randomUUID().toString().substring(0, 8) + "@example.com";
		postJson("/api/v1/auth/register/email", "{\"email\":\"" + email + "\"}").andExpect(status().isAccepted());
		String verifyCode = sender.lastCode(email, OtpPurpose.REGISTER);
		postJson("/api/v1/auth/register/email/verify", "{\"email\":\"" + email + "\",\"code\":\"" + verifyCode
				+ "\",\"password\":\"" + PASSWORD + "\"}").andExpect(status().isOk());
		String phone = newPhone();
		String access = field(registerPhone(phone, PASSWORD), "accessToken");
		int sentBefore = sender.sendCount(email);
		clock.advance(Duration.ofSeconds(61));

		postAuthed("/api/v1/auth/contact/change/request", "{\"type\":\"EMAIL\",\"newValue\":\"" + email.toUpperCase()
				+ "\",\"currentPassword\":\"" + PASSWORD + "\"}", access).andExpect(status().isAccepted());

		assertThat(sender.sendCount(email)).isEqualTo(sentBefore);
		postAuthed("/api/v1/auth/contact/change/confirm",
				"{\"type\":\"EMAIL\",\"newValue\":\"" + email + "\",\"code\":\"123456\"}", access)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("OTP_INVALID"));
	}

	@Test
	void changeContactWithoutTokenIs401() throws Exception {
		postJson("/api/v1/auth/contact/change/request", "{\"type\":\"PHONE\",\"newValue\":\"0912345678\"}")
				.andExpect(status().isUnauthorized());
		postJson("/api/v1/auth/password/change", "{\"currentPassword\":\"x\",\"newPassword\":\"" + NEW_PASSWORD + "\"}")
				.andExpect(status().isUnauthorized());
	}

	@Test
	void invalidNewContactAndMissingPasswordAreValidationErrors() throws Exception {
		String phone = newPhone();
		String access = field(registerPhone(phone, PASSWORD), "accessToken");

		postAuthed("/api/v1/auth/contact/change/request", "{\"type\":\"PHONE\",\"newValue\":\"abc\",\"currentPassword\":\""
				+ PASSWORD + "\"}", access).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		postAuthed("/api/v1/auth/contact/change/request", "{\"type\":\"PHONE\",\"newValue\":\"" + newPhone() + "\"}", access)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		postAuthed("/api/v1/auth/contact/change/request", "{\"type\":\"FAX\",\"newValue\":\"1\"}", access)
				.andExpect(status().isBadRequest());
	}

}
