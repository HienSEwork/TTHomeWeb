package vn.tthome.identity.services.jwt;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.services.jwt.impl.JwtServiceImpl;
import vn.tthome.identity.support.MutableClock;
import vn.tthome.identity.support.TestAuthProperties;

class JwtServiceTest {

	private static final Instant START = Instant.parse("2026-10-27T00:00:00Z");

	private MutableClock clock;
	private JwtService jwt;

	@BeforeEach
	void setUp() {
		clock = new MutableClock(START);
		jwt = new JwtServiceImpl(TestAuthProperties.defaults(), clock);
	}

	private static void assertInvalid(Runnable call) {
		assertThatThrownBy(call::run)
				.isInstanceOfSatisfying(ApiException.class, e -> {
					assertThat(e.code()).isEqualTo("TOKEN_INVALID");
					assertThat(e.status().value()).isEqualTo(401);
				});
	}

	@Test
	void roundTripKeepsUserSessionAndRoles() {
		UUID user = UUID.randomUUID();
		UUID session = UUID.randomUUID();

		String token = jwt.issueAccessToken(user, session, List.of("TENANT", "LANDLORD"));
		AccessClaims claims = jwt.parse(token);

		assertThat(claims.userId()).isEqualTo(user);
		assertThat(claims.sessionId()).isEqualTo(session);
		assertThat(claims.roles()).containsExactlyInAnyOrder("TENANT", "LANDLORD");
		assertThat(jwt.expiresAt(token)).isEqualTo(START.plus(Duration.ofMinutes(15)));
	}

	@Test
	void expiredTokenIsRejected() {
		String token = jwt.issueAccessToken(UUID.randomUUID(), UUID.randomUUID(), List.of("TENANT"));
		clock.advance(Duration.ofMinutes(16));

		assertInvalid(() -> jwt.parse(token));
	}

	@Test
	void tamperedSignatureIsRejected() {
		String token = jwt.issueAccessToken(UUID.randomUUID(), UUID.randomUUID(), List.of("TENANT"));
		String tampered = token.substring(0, token.length() - 2) + (token.endsWith("AA") ? "BB" : "AA");

		assertInvalid(() -> jwt.parse(tampered));
	}

	@Test
	void algNoneTokenIsRejected() {
		Base64.Encoder enc = Base64.getUrlEncoder().withoutPadding();
		String header = enc.encodeToString("{\"alg\":\"none\"}".getBytes(StandardCharsets.UTF_8));
		String payload = enc.encodeToString(("{\"sub\":\"" + UUID.randomUUID() + "\",\"jti\":\"" + UUID.randomUUID()
				+ "\",\"roles\":[\"ADMIN\"],\"exp\":" + START.plusSeconds(600).getEpochSecond() + "}")
				.getBytes(StandardCharsets.UTF_8));

		assertInvalid(() -> jwt.parse(header + "." + payload + "."));
	}

	@Test
	void garbageStringIsRejected() {
		assertInvalid(() -> jwt.parse("not-a-jwt"));
		assertInvalid(() -> jwt.parse(""));
	}

	@Test
	void tokenFromAnotherSecretIsRejected() {
		JwtService other = new JwtServiceImpl(
				TestAuthProperties.withSecret("another-secret-another-secret-another-secret"), clock);
		String token = other.issueAccessToken(UUID.randomUUID(), UUID.randomUUID(), List.of("ADMIN"));

		assertInvalid(() -> jwt.parse(token));
	}

}
