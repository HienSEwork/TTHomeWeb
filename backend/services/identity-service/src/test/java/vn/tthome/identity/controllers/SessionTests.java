package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
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
class SessionTests extends IdentityIntegrationTestBase {

	private static final String PASSWORD = "correct-horse-battery";
	private static final AtomicInteger COUNTER = new AtomicInteger(9000);

	@Autowired
	MockMvc mvc;
	@Autowired
	InMemoryMessageSender sender;
	@Autowired
	MutableClock clock;
	@Autowired
	JdbcClient jdbc;

	private static String ip() {
		return "198.18.0." + (COUNTER.incrementAndGet() % 250 + 1);
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

	/** Registers a phone account that has a password and returns the local phone number. */
	private String newAccount() throws Exception {
		String phone = "09" + String.format("%08d", 30_000_000 + COUNTER.incrementAndGet() * 13);
		postJson("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}").andExpect(status().isAccepted());
		String code = sender.lastCode("+84" + phone.substring(1), OtpPurpose.REGISTER);
		postJson("/api/v1/auth/register/phone/verify",
				"{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk());
		return phone;
	}

	private ResultActions login(String phone, String password) throws Exception {
		return postJson("/api/v1/auth/login", "{\"identifier\":\"" + phone + "\",\"password\":\"" + password + "\"}");
	}

	private static String field(String json, String name) {
		return json.replaceAll(".*\"" + name + "\":\"([^\"]+)\".*", "$1");
	}

	private String loginBody(String phone) throws Exception {
		return login(phone, PASSWORD).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
	}

	private ResultActions refresh(String refreshToken) throws Exception {
		return postJson("/api/v1/auth/refresh", "{\"refreshToken\":\"" + refreshToken + "\"}");
	}

	@Test
	void logoutRevokesThatRefreshTokenOnly() throws Exception {
		String phone = newAccount();
		String a = field(loginBody(phone), "refreshToken");
		String b = field(loginBody(phone), "refreshToken");

		postJson("/api/v1/auth/logout", "{\"refreshToken\":\"" + a + "\"}").andExpect(status().isNoContent());

		refresh(a).andExpect(status().isUnauthorized());
		refresh(b).andExpect(status().isOk());
	}

	@Test
	void logoutTwiceStillReturns204() throws Exception {
		String phone = newAccount();
		String token = field(loginBody(phone), "refreshToken");

		postJson("/api/v1/auth/logout", "{\"refreshToken\":\"" + token + "\"}").andExpect(status().isNoContent());
		postJson("/api/v1/auth/logout", "{\"refreshToken\":\"" + token + "\"}").andExpect(status().isNoContent());
		postJson("/api/v1/auth/logout", "{\"refreshToken\":\"never-issued\"}").andExpect(status().isNoContent());
	}

	@Test
	void logoutAllRevokesEveryRefreshTokenOfTheUser() throws Exception {
		String phone = newAccount();
		String first = loginBody(phone);
		String second = loginBody(phone);

		mvc.perform(post("/api/v1/auth/logout-all").header("Authorization", "Bearer " + field(first, "accessToken"))
				.with(fromIp(ip()))).andExpect(status().isNoContent());

		refresh(field(first, "refreshToken")).andExpect(status().isUnauthorized());
		refresh(field(second, "refreshToken")).andExpect(status().isUnauthorized());
		mvc.perform(post("/api/v1/auth/logout-all")).andExpect(status().isUnauthorized());
	}

	@Test
	void fifthWrongPasswordLocksTheAccountAndEvenTheCorrectPasswordGets423() throws Exception {
		String phone = newAccount();
		for (int i = 0; i < 5; i++) {
			login(phone, "wrong-password-" + i).andExpect(status().isUnauthorized());
		}

		login(phone, PASSWORD).andExpect(status().isLocked()).andExpect(jsonPath("$.code").value("ACCOUNT_LOCKED"));
	}

	@Test
	void lockExpiresAfter15MinutesAndOneWrongPasswordDoesNotRelock() throws Exception {
		String phone = newAccount();
		for (int i = 0; i < 5; i++) {
			login(phone, "wrong-password-" + i).andExpect(status().isUnauthorized());
		}
		login(phone, PASSWORD).andExpect(status().isLocked());
		clock.advance(Duration.ofMinutes(15).plusSeconds(1));

		login(phone, "wrong-after-expiry").andExpect(status().isUnauthorized());
		login(phone, PASSWORD).andExpect(status().isOk());
	}

	@Test
	void fourWrongPasswordsDoNotLockAndSuccessResetsTheCounter() throws Exception {
		String phone = newAccount();
		for (int i = 0; i < 4; i++) {
			login(phone, "wrong-password-" + i).andExpect(status().isUnauthorized());
		}
		login(phone, PASSWORD).andExpect(status().isOk());
		assertThat(jdbc.sql("select failed_login_count from identity.user_account where phone = :p")
				.param("p", "+84" + phone.substring(1)).query(Integer.class).single()).isZero();

		for (int i = 0; i < 4; i++) {
			login(phone, "wrong-again-" + i).andExpect(status().isUnauthorized());
		}
		login(phone, PASSWORD).andExpect(status().isOk());
	}

	@Test
	void meReturnsTheAuthenticatedUserWithRoles() throws Exception {
		String phone = newAccount();
		String access = field(loginBody(phone), "accessToken");

		mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + access))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.phone").value("+84" + phone.substring(1)))
				.andExpect(jsonPath("$.roles[0]").value("TENANT"))
				.andExpect(jsonPath("$.id").isNotEmpty());
	}

	@Test
	void meWithoutTokenIs401() throws Exception {
		mvc.perform(get("/api/v1/auth/me")).andExpect(status().isUnauthorized());
	}

	private List<Integer> parallelLogins(String phone, String password, int threads) throws Exception {
		CountDownLatch go = new CountDownLatch(1);
		Callable<Integer> attempt = () -> {
			go.await();
			return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
					.content("{\"identifier\":\"" + phone + "\",\"password\":\"" + password + "\"}")
					.with(fromIp(ip()))).andReturn().getResponse().getStatus();
		};
		ExecutorService pool = Executors.newFixedThreadPool(threads);
		try {
			List<Future<Integer>> futures = new ArrayList<>();
			for (int i = 0; i < threads; i++) {
				futures.add(pool.submit(attempt));
			}
			go.countDown();
			List<Integer> statuses = new ArrayList<>();
			for (Future<Integer> f : futures) {
				statuses.add(f.get());
			}
			return statuses;
		} finally {
			pool.shutdownNow();
		}
	}

	@Test
	void parallelLoginsOfOneAccountAllSucceed() throws Exception {
		String phone = newAccount();

		assertThat(parallelLogins(phone, PASSWORD, 8)).containsOnly(200);
	}

	@Test
	void parallelWrongPasswordsCannotSpendMoreThanTheAttemptBudget() throws Exception {
		String phone = newAccount();

		List<Integer> statuses = parallelLogins(phone, "wrong-password-parallel", 24);

		assertThat(statuses).allMatch(s -> s == 401 || s == 423);
		assertThat(statuses.stream().filter(s -> s == 401).count()).isLessThanOrEqualTo(5);
		login(phone, PASSWORD).andExpect(status().isLocked());
	}

}
