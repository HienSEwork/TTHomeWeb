package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
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
class EmailAuthTests extends IdentityIntegrationTestBase {

	private static final String PASSWORD = "correct-horse-battery";
	private static final AtomicInteger COUNTER = new AtomicInteger(5000);

	@Autowired
	MockMvc mvc;
	@Autowired
	InMemoryMessageSender sender;
	@Autowired
	MutableClock clock;
	@Autowired
	JdbcClient jdbc;

	private static String newEmail() {
		return "user" + UUID.randomUUID().toString().substring(0, 8) + "@Example.com";
	}

	private static String ip() {
		return "192.0.2." + (COUNTER.incrementAndGet() % 250 + 1);
	}

	private static RequestPostProcessor fromIp(String ip) {
		return request -> {
			request.setRemoteAddr(ip);
			return request;
		};
	}

	private ResultActions send(String path, String json, String ip) throws Exception {
		return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json).with(fromIp(ip)));
	}

	private void requestCode(String email, String ip) throws Exception {
		send("/api/v1/auth/register/email", "{\"email\":\"" + email + "\"}", ip).andExpect(status().isAccepted());
	}

	private ResultActions verify(String email, String code, String password, boolean remember, String ip)
			throws Exception {
		return send("/api/v1/auth/register/email/verify", "{\"email\":\"" + email + "\",\"code\":\"" + code
				+ "\",\"password\":\"" + password + "\",\"fullName\":\"Tran B\",\"rememberMe\":" + remember + "}", ip);
	}

	private String codeFor(String email) {
		return sender.lastCode(email.trim().toLowerCase(), OtpPurpose.REGISTER);
	}

	/** Requests a code and confirms it with the password: the whole registration. */
	private void register(String email, String password, String ip) throws Exception {
		requestCode(email, ip);
		verify(email, codeFor(email), password, false, ip)
				.andExpect(status().isOk()).andExpect(jsonPath("$.accessToken").isNotEmpty());
	}

	private int accountsOf(String email) {
		return jdbc.sql("select count(*) from identity.user_account where lower(email) = :e")
				.param("e", email.toLowerCase()).query(Integer.class).single();
	}

	private ResultActions login(String identifier, String password, boolean remember, String ip) throws Exception {
		return send("/api/v1/auth/login",
				"{\"identifier\":\"" + identifier + "\",\"password\":\"" + password + "\",\"rememberMe\":" + remember + "}",
				ip);
	}

	@Test
	void registerThenLoginWithEmailInOtherCase() throws Exception {
		String email = newEmail();
		String ip = ip();

		register(email, PASSWORD, ip);

		login(email.toUpperCase(), PASSWORD, false, ip)
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.refreshToken").isNotEmpty());
		assertThat(jdbc.sql("select email_verified_at is not null from identity.user_account where lower(email) = :e")
				.param("e", email.toLowerCase()).query(Boolean.class).single()).isTrue();
	}

	@Test
	void requestingACodeCreatesNoAccount() throws Exception {
		String email = newEmail();
		String ip = ip();

		requestCode(email, ip);

		assertThat(accountsOf(email)).isZero();
		login(email, PASSWORD, false, ip)
				.andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("INVALID_CREDENTIALS"));
	}

	@Test
	void aWrongCodeCreatesNoAccount() throws Exception {
		String email = newEmail();
		String ip = ip();
		requestCode(email, ip);
		String code = codeFor(email);
		String wrong = (code.charAt(5) == '0' ? code.substring(0, 5) + "1" : code.substring(0, 5) + "0");

		verify(email, wrong, PASSWORD, false, ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("OTP_INVALID"));

		assertThat(accountsOf(email)).isZero();
	}

	@Test
	void wrongPasswordAndUnknownAccountGiveIdenticalResponses() throws Exception {
		String email = newEmail();
		String ip = ip();
		register(email, PASSWORD, ip);

		String wrong = login(email, "not-the-password", false, ip)
				.andExpect(status().isUnauthorized())
				.andReturn().getResponse().getContentAsString();
		String unknown = login(newEmail(), "not-the-password", false, ip)
				.andExpect(status().isUnauthorized())
				.andReturn().getResponse().getContentAsString();

		assertThat(wrong).isEqualTo(unknown).contains("INVALID_CREDENTIALS");
	}

	@Test
	void requestForARegisteredEmailSendsNothingAndItsDecoyCodeCannotReplaceThePassword() throws Exception {
		String email = newEmail();
		String ip = ip();
		register(email, PASSWORD, ip);
		clock.advance(Duration.ofSeconds(61));
		int sentBefore = sender.sendCount(email.toLowerCase());

		requestCode(email, ip);

		assertThat(sender.sendCount(email.toLowerCase())).isEqualTo(sentBefore);
		verify(email, "123456", "attacker-password-1", false, ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("OTP_INVALID"));
		assertThat(accountsOf(email)).isEqualTo(1);
		login(email, PASSWORD, false, ip).andExpect(status().isOk());
		login(email, "attacker-password-1", false, ip).andExpect(status().isUnauthorized());
	}

	@Test
	void rememberMeFlagChangesRefreshExpiry() throws Exception {
		String email = newEmail();
		String ip = ip();
		register(email, PASSWORD, ip);

		String shortLived = login(email, PASSWORD, false, ip).andReturn().getResponse().getContentAsString();
		String longLived = login(email, PASSWORD, true, ip).andReturn().getResponse().getContentAsString();

		Instant shortExp = Instant.parse(shortLived.replaceAll(".*\"refreshExpiresAt\":\"([^\"]+)\".*", "$1"));
		Instant longExp = Instant.parse(longLived.replaceAll(".*\"refreshExpiresAt\":\"([^\"]+)\".*", "$1"));
		assertThat(Duration.between(shortExp, longExp).toDays()).isGreaterThanOrEqualTo(28);
	}

	@Test
	void invalidBodiesAreValidationErrors() throws Exception {
		String ip = ip();
		String email = newEmail();

		send("/api/v1/auth/register/email", "{}", ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		send("/api/v1/auth/register/email", "{\"email\":\"not-an-email\"}", ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		send("/api/v1/auth/login", "{}", ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		send("/api/v1/auth/register/email/verify", "{\"email\":\"" + email + "\",\"code\":\"123456\"}", ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		verify(email, "123456", "short", false, ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		verify(email, "123456", "a".repeat(129), false, ip)
				.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void identifierCanBeThePhoneOfAPasswordAccount() throws Exception {
		String phone = "09" + String.format("%08d", 20_000_000 + COUNTER.incrementAndGet() * 11);
		String ip = ip();
		send("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}", ip).andExpect(status().isAccepted());
		String code = sender.lastCode("+84" + phone.substring(1), OtpPurpose.REGISTER);
		send("/api/v1/auth/register/phone/verify",
				"{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\",\"password\":\"" + PASSWORD + "\"}", ip)
				.andExpect(status().isOk());

		login(phone, PASSWORD, false, ip).andExpect(status().isOk());
		login("+84 " + phone.substring(1), PASSWORD, false, ip).andExpect(status().isOk());
	}

	@Test
	void twoConcurrentConfirmationsOfOneCodeCreateExactlyOneAccount() throws Exception {
		String email = newEmail();
		requestCode(email, ip());
		String code = codeFor(email);
		CountDownLatch go = new CountDownLatch(1);
		Callable<Integer> confirm = () -> {
			go.await();
			return verify(email, code, PASSWORD, false, ip()).andReturn().getResponse().getStatus();
		};
		ExecutorService pool = Executors.newFixedThreadPool(2);
		try {
			Future<Integer> a = pool.submit(confirm);
			Future<Integer> b = pool.submit(confirm);
			go.countDown();

			// The code is single-use: one caller wins, the other is told the code is no longer valid (never a 500).
			List<Integer> statuses = List.of(a.get(), b.get());
			assertThat(statuses).containsOnlyOnce(200);
			assertThat(statuses).allMatch(status -> status == 200 || status == 400 || status == 409);
		} finally {
			pool.shutdownNow();
		}
		assertThat(accountsOf(email)).isEqualTo(1);
	}

}
