package vn.tthome.identity.services.session;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.support.MutableClock;

/** Not @Transactional: rotation and its concurrency rely on real commits. */
class SessionRefreshTests extends IdentityIntegrationTestBase {

	@Autowired
	SessionService sessions;
	@Autowired
	UserAccountRepository users;
	@Autowired
	MutableClock clock;
	@Autowired
	JdbcClient jdbc;

	private UserAccount newUser() {
		UserAccount u = new UserAccount();
		u.setPhone("+849" + String.format("%08d", (long) (Math.random() * 100_000_000L)));
		return users.saveAndFlush(u);
	}

	private static void assertTokenInvalid(Runnable call) {
		assertThatThrownBy(call::run).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.code()).isEqualTo("TOKEN_INVALID");
			assertThat(e.status().value()).isEqualTo(401);
		});
	}

	private int activeSessions(UserAccount user) {
		return jdbc.sql("select count(*) from identity.refresh_token where user_id = :u and revoked_at is null")
				.param("u", user.getId()).query(Integer.class).single();
	}

	@Test
	void refreshReturnsNewPairAndRevokesTheOld() {
		UserAccount user = newUser();
		TokenPair first = sessions.issue(user, false, "device", "203.0.113.20");

		TokenPair second = sessions.refresh(first.refreshToken(), "device", "203.0.113.20");

		assertThat(second.refreshToken()).isNotEqualTo(first.refreshToken());
		assertThat(second.accessToken()).isNotEqualTo(first.accessToken());
		assertThat(activeSessions(user)).isEqualTo(1);
		assertTokenInvalid(() -> sessions.refresh(first.refreshToken(), null, null));
	}

	@Test
	void reusingARotatedTokenRevokesEverySessionOfTheUser() {
		UserAccount user = newUser();
		TokenPair first = sessions.issue(user, false, null, null);
		TokenPair second = sessions.refresh(first.refreshToken(), null, null);

		assertTokenInvalid(() -> sessions.refresh(first.refreshToken(), null, null));

		assertThat(activeSessions(user)).isZero();
		assertTokenInvalid(() -> sessions.refresh(second.refreshToken(), null, null));
	}

	@Test
	void rotationKeepsTheRememberMeLifetime() {
		UserAccount user = newUser();
		TokenPair remembered = sessions.issue(user, true, null, null);

		TokenPair rotated = sessions.refresh(remembered.refreshToken(), null, null);

		assertThat(Duration.between(clock.instant(), rotated.refreshExpiresAt()).toDays()).isGreaterThanOrEqualTo(29);
	}

	@Test
	void twoConcurrentRefreshesOfOneTokenYieldExactlyOneSuccess() throws Exception {
		UserAccount user = newUser();
		TokenPair first = sessions.issue(user, false, null, null);
		CountDownLatch go = new CountDownLatch(1);
		Callable<Boolean> attempt = () -> {
			go.await();
			try {
				sessions.refresh(first.refreshToken(), null, null);
				return true;
			} catch (ApiException e) {
				return false;
			}
		};
		ExecutorService pool = Executors.newFixedThreadPool(2);
		try {
			Future<Boolean> a = pool.submit(attempt);
			Future<Boolean> b = pool.submit(attempt);
			go.countDown();
			List<Boolean> results = List.of(a.get(), b.get());

			assertThat(results).containsExactlyInAnyOrder(true, false);
		} catch (ExecutionException e) {
			throw new AssertionError("refresh must fail with ApiException only", e);
		} finally {
			pool.shutdownNow();
		}
	}

	@Test
	void expiredRefreshTokenIs401() {
		UserAccount user = newUser();
		TokenPair first = sessions.issue(user, false, null, null);
		clock.advance(Duration.ofHours(25));

		assertTokenInvalid(() -> sessions.refresh(first.refreshToken(), null, null));
	}

	@Test
	void refreshForLockedAccountIs401() {
		UserAccount user = newUser();
		TokenPair first = sessions.issue(user, false, null, null);
		user.setStatus(UserStatus.LOCKED);
		users.saveAndFlush(user);

		assertTokenInvalid(() -> sessions.refresh(first.refreshToken(), null, null));
	}

	@Test
	void unknownTokenIs401() {
		assertTokenInvalid(() -> sessions.refresh("definitely-not-a-token", null, null));
	}

	@Test
	void presentingALoggedOutTokenFailsButKeepsTheOtherSessions() {
		UserAccount user = newUser();
		TokenPair first = sessions.issue(user, false, null, null);
		TokenPair second = sessions.issue(user, false, null, null);
		sessions.logout(first.refreshToken());

		assertTokenInvalid(() -> sessions.refresh(first.refreshToken(), null, null));

		assertThat(activeSessions(user)).isEqualTo(1);
		sessions.refresh(second.refreshToken(), null, null);
	}

}
