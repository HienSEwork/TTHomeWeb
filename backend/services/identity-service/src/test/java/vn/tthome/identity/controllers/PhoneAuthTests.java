package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.List;
import java.util.ArrayList;
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
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.support.InMemoryMessageSender;
import vn.tthome.identity.support.MutableClock;

@AutoConfigureMockMvc
class PhoneAuthTests extends IdentityIntegrationTestBase {

	@Autowired
	MockMvc mvc;
	@Autowired
	InMemoryMessageSender sender;
	@Autowired
	MutableClock clock;
	@Autowired
	UserAccountRepository users;
	@Autowired
	JdbcClient jdbc;

	private static final AtomicInteger COUNTER = new AtomicInteger(1000);

	/** Each test uses its own phone and its own client IP so the shared per-IP OTP limit never interferes. */
	private static String newPhone() {
		return "09" + String.format("%08d", 10_000_000 + COUNTER.incrementAndGet() * 7 + (int) (Math.random() * 5));
	}

	private static String normalized(String local) {
		return "+84" + local.substring(1);
	}

	private static RequestPostProcessor fromIp(String ip) {
		return request -> {
			request.setRemoteAddr(ip);
			return request;
		};
	}

	private static String ip() {
		return "198.51.100." + (COUNTER.incrementAndGet() % 250 + 1);
	}

	private void post202(String path, String json, String ip) throws Exception {
		mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json).with(fromIp(ip)))
				.andExpect(status().isAccepted());
	}

	private String register(String phoneLocal, String ip) throws Exception {
		post202("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phoneLocal + "\"}", ip);
		String code = sender.lastCode(normalized(phoneLocal), OtpPurpose.REGISTER);
		return mvc.perform(post("/api/v1/auth/register/phone/verify").contentType(MediaType.APPLICATION_JSON)
				.content("{\"phone\":\"" + phoneLocal + "\",\"code\":\"" + code + "\",\"fullName\":\"Nguyen Van A\"}")
				.with(fromIp(ip)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty())
				.andExpect(jsonPath("$.refreshToken").isNotEmpty())
				.andReturn().getResponse().getContentAsString();
	}

	@Test
	void registerRequestForNewPhoneSendsAnOtp() throws Exception {
		String phone = newPhone();

		post202("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}", ip());

		assertThat(sender.sendCount(normalized(phone))).isEqualTo(1);
	}

	@Test
	void registerRequestForExistingPhoneAnswers202AndSendsNothing() throws Exception {
		String phone = newPhone();
		UserAccount existing = new UserAccount();
		existing.setPhone(normalized(phone));
		users.saveAndFlush(existing);

		post202("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}", ip());

		assertThat(sender.sendCount(normalized(phone))).isZero();
	}

	@Test
	void verifyCreatesTenantAccountAndReturnsTokens() throws Exception {
		String phone = newPhone();

		register(phone, ip());

		UserAccount user = users.findByPhoneAndDeletedAtIsNull(normalized(phone)).orElseThrow();
		assertThat(user.getPhoneVerifiedAt()).isNotNull();
		assertThat(user.getFullName()).isEqualTo("Nguyen Van A");
		assertThat(jdbc.sql("select r.code from identity.user_role ur join identity.role r on r.id = ur.role_id "
				+ "where ur.user_id = :id").param("id", user.getId()).query(String.class).list())
				.containsExactly("TENANT");
	}

	@Test
	void phoneInThreeFormatsRegistersOnlyOnce() throws Exception {
		String phone = newPhone();
		String ip = ip();
		register(phone, ip);
		clock.advance(Duration.ofSeconds(61));

		post202("/api/v1/auth/register/phone/request", "{\"phone\":\"+84 " + phone.substring(1) + "\"}", ip);
		mvc.perform(post("/api/v1/auth/register/phone/verify").contentType(MediaType.APPLICATION_JSON)
				.content("{\"phone\":\"84" + phone.substring(1) + "\",\"code\":\"000000\"}").with(fromIp(ip)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("OTP_INVALID"));

		assertThat(jdbc.sql("select count(*) from identity.user_account where phone = :p")
				.param("p", normalized(phone)).query(Integer.class).single()).isEqualTo(1);
	}

	@Test
	void twoConcurrentVerifiesCreateOneAccount() throws Exception {
		String phone = newPhone();
		String ip = ip();
		post202("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}", ip);
		String code = sender.lastCode(normalized(phone), OtpPurpose.REGISTER);
		String body = "{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\"}";
		CountDownLatch go = new CountDownLatch(1);
		Callable<Integer> verify = () -> {
			go.await();
			return mvc.perform(post("/api/v1/auth/register/phone/verify").contentType(MediaType.APPLICATION_JSON)
					.content(body).with(fromIp(ip))).andReturn().getResponse().getStatus();
		};
		ExecutorService pool = Executors.newFixedThreadPool(2);
		try {
			Future<Integer> a = pool.submit(verify);
			Future<Integer> b = pool.submit(verify);
			go.countDown();
			List<Integer> statuses = List.of(a.get(), b.get());

			assertThat(statuses).containsOnlyOnce(200);
			assertThat(statuses).allMatch(s -> s == 200 || s == 400 || s == 409);
		} finally {
			pool.shutdownNow();
		}
		assertThat(jdbc.sql("select count(*) from identity.user_account where phone = :p")
				.param("p", normalized(phone)).query(Integer.class).single()).isEqualTo(1);
	}

	@Test
	void otpLoginWorksForExistingPhoneAndFailsForUnknownOne() throws Exception {
		String phone = newPhone();
		String ip = ip();
		register(phone, ip);
		clock.advance(Duration.ofSeconds(61));

		post202("/api/v1/auth/login/otp/request", "{\"phone\":\"" + phone + "\"}", ip);
		String code = sender.lastCode(normalized(phone), OtpPurpose.LOGIN);
		mvc.perform(post("/api/v1/auth/login/otp/verify").contentType(MediaType.APPLICATION_JSON)
				.content("{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\"}").with(fromIp(ip)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").isNotEmpty());

		String unknown = newPhone();
		post202("/api/v1/auth/login/otp/request", "{\"phone\":\"" + unknown + "\"}", ip());
		assertThat(sender.sendCount(normalized(unknown))).isZero();
		mvc.perform(post("/api/v1/auth/login/otp/verify").contentType(MediaType.APPLICATION_JSON)
				.content("{\"phone\":\"" + unknown + "\",\"code\":\"123456\"}").with(fromIp(ip())))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("OTP_INVALID"));
	}

	@Test
	void wrongCodeIs400OtpInvalid() throws Exception {
		String phone = newPhone();
		String ip = ip();
		post202("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}", ip);
		String code = sender.lastCode(normalized(phone), OtpPurpose.REGISTER);
		String wrong = code.equals("000000") ? "111111" : "000000";

		mvc.perform(post("/api/v1/auth/register/phone/verify").contentType(MediaType.APPLICATION_JSON)
				.content("{\"phone\":\"" + phone + "\",\"code\":\"" + wrong + "\"}").with(fromIp(ip)))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("OTP_INVALID"));
	}

	@Test
	void passwordLongerThan128AndMalformedBodiesAreValidationErrors() throws Exception {
		String phone = newPhone();
		String longPassword = "a".repeat(129);

		mvc.perform(post("/api/v1/auth/register/phone/verify").contentType(MediaType.APPLICATION_JSON)
				.content("{\"phone\":\"" + phone + "\",\"code\":\"123456\",\"password\":\"" + longPassword + "\"}")
				.with(fromIp(ip())))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		mvc.perform(post("/api/v1/auth/register/phone/request").contentType(MediaType.APPLICATION_JSON).content("{}")
				.with(fromIp(ip())))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		mvc.perform(post("/api/v1/auth/register/phone/request").contentType(MediaType.APPLICATION_JSON).content("{oops")
				.with(fromIp(ip())))
				.andExpect(status().isBadRequest());
		mvc.perform(post("/api/v1/auth/register/phone/request").contentType(MediaType.APPLICATION_JSON)
				.content("{\"phone\":\"not-a-phone\"}").with(fromIp(ip())))
				.andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void parallelWrongCodesCannotSpendMoreThanFiveAttempts() throws Exception {
		String phone = newPhone();
		String ip = ip();
		post202("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}", ip);
		String code = sender.lastCode(normalized(phone), OtpPurpose.REGISTER);
		String wrong = code.equals("000000") ? "111111" : "000000";
		CountDownLatch go = new CountDownLatch(1);
		Callable<Integer> guess = () -> {
			go.await();
			return mvc.perform(post("/api/v1/auth/register/phone/verify").contentType(MediaType.APPLICATION_JSON)
					.content("{\"phone\":\"" + phone + "\",\"code\":\"" + wrong + "\"}").with(fromIp(ip)))
					.andReturn().getResponse().getStatus();
		};
		ExecutorService pool = Executors.newFixedThreadPool(20);
		try {
			List<Future<Integer>> futures = new ArrayList<>();
			for (int i = 0; i < 20; i++) {
				futures.add(pool.submit(guess));
			}
			go.countDown();
			for (Future<Integer> f : futures) {
				assertThat(f.get()).isEqualTo(400);
			}
		} finally {
			pool.shutdownNow();
		}

		assertThat(jdbc.sql("select max(attempts) from identity.otp_challenge where target = :t")
				.param("t", normalized(phone)).query(Integer.class).single()).isLessThanOrEqualTo(5);
	}

}
