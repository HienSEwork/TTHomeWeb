package vn.tthome.identity.services.session;

import static org.assertj.core.api.Assertions.assertThat;

import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.RefreshToken;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.repos.refreshtoken.RefreshTokenRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.support.MutableClock;
import vn.tthome.identity.services.jwt.JwtService;

@Transactional
class SessionServiceTests extends IdentityIntegrationTestBase {

	@Autowired
	SessionService sessions;
	@Autowired
	JwtService jwt;
	@Autowired
	UserAccountRepository users;
	@Autowired
	RefreshTokenRepository refreshTokens;
	@Autowired
	JdbcClient jdbc;
	@Autowired
	MutableClock clock;

	private UserAccount user() {
		UserAccount u = new UserAccount();
		u.setPhone("+849" + String.format("%08d", (long) (Math.random() * 100_000_000L)));
		return users.saveAndFlush(u);
	}

	private static String sha256Hex(String value) throws Exception {
		return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes("UTF-8")));
	}

	private RefreshToken rowOf(UserAccount user) {
		List<RefreshToken> rows = refreshTokens.findAll().stream().filter(t -> t.getUserId().equals(user.getId())).toList();
		assertThat(rows).hasSize(1);
		return rows.get(0);
	}

	@Test
	void issueStoresOnlyTheHashOfTheRefreshToken() throws Exception {
		UserAccount user = user();

		TokenPair pair = sessions.issue(user, false, "test-device", "203.0.113.9");

		RefreshToken row = rowOf(user);
		assertThat(row.getTokenHash()).isEqualTo(sha256Hex(pair.refreshToken())).isNotEqualTo(pair.refreshToken());
		assertThat(jdbc.sql("select count(*) from identity.refresh_token where token_hash = :t")
				.param("t", pair.refreshToken()).query(Integer.class).single()).isZero();
	}

	@Test
	void accessTokenJtiEqualsStoredSessionId() {
		UserAccount user = user();

		TokenPair pair = sessions.issue(user, false, null, null);

		assertThat(jwt.parse(pair.accessToken()).sessionId()).isEqualTo(rowOf(user).getId());
		assertThat(jwt.parse(pair.accessToken()).userId()).isEqualTo(user.getId());
	}

	@Test
	void rememberMeExtendsRefreshLifetimeTo30Days() {
		UserAccount user = user();

		TokenPair pair = sessions.issue(user, true, null, null);

		assertThat(Duration.between(clock.instant(), pair.refreshExpiresAt()).toDays()).isEqualTo(30);
		assertThat(pair.refreshExpiresAt()).isEqualTo(rowOf(user).getExpiresAt());
	}

	@Test
	void refreshLifetimeDefaultsTo24Hours() {
		UserAccount user = user();

		TokenPair pair = sessions.issue(user, false, null, null);

		assertThat(Duration.between(clock.instant(), pair.refreshExpiresAt()).toHours()).isEqualTo(24);
	}

}
