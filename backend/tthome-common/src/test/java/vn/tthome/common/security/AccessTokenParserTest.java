package vn.tthome.common.security;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vn.tthome.common.error.ApiException;

public class AccessTokenParserTest {

	public static final String SECRET = "test-only-jwt-secret-0123456789-abcdefghij";
	public static final Instant NOW = Instant.parse("2026-05-01T10:00:00Z");

	private final Clock clock = Clock.fixed(NOW, ZoneOffset.UTC);
	private final AccessTokenParser parser = new AccessTokenParser(SECRET, clock);

	/** Signs a token the way identity-service does. */
	public static String token(String secret, UUID user, UUID session, List<String> roles, Instant expires) {
		var builder = Jwts.builder().subject(user.toString()).id(session.toString())
				.issuedAt(Date.from(expires.minus(Duration.ofHours(1)))).expiration(Date.from(expires));
		if (roles != null) {
			builder.claim("roles", roles);
		}
		return builder.signWith(Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256).compact();
	}

	private static void assertInvalid(Runnable call) {
		assertThatThrownBy(call::run).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(HttpStatus.UNAUTHORIZED);
			assertThat(e.code()).isEqualTo("TOKEN_INVALID");
		});
	}

	@Test
	void readsTheClaimsOfAValidToken() {
		UUID user = UUID.randomUUID();
		UUID session = UUID.randomUUID();

		AccessClaims claims = parser
				.parse(token(SECRET, user, session, List.of("ADMIN", "TENANT"), NOW.plus(Duration.ofMinutes(5))));

		assertThat(claims).isEqualTo(new AccessClaims(user, session, List.of("ADMIN", "TENANT")));
	}

	@Test
	void aTokenWithoutRolesHasNone() {
		AccessClaims claims = parser
				.parse(token(SECRET, UUID.randomUUID(), UUID.randomUUID(), null, NOW.plus(Duration.ofMinutes(5))));

		assertThat(claims.roles()).isEmpty();
	}

	@Test
	void rejectsExpiredForgedMalformedAndIncompleteTokens() {
		UUID user = UUID.randomUUID();
		UUID session = UUID.randomUUID();
		String valid = token(SECRET, user, session, List.of("ADMIN"), NOW.plus(Duration.ofMinutes(5)));
		var key = Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8));

		assertInvalid(() -> parser.parse(token(SECRET, user, session, List.of("ADMIN"), NOW.minusSeconds(1))));
		assertInvalid(() -> parser.parse(token("another-secret-0123456789-abcdefghijklmnop", user, session,
				List.of("ADMIN"), NOW.plus(Duration.ofMinutes(5)))));
		assertInvalid(() -> parser.parse(valid.substring(0, valid.length() - 2) + "xx"));
		assertInvalid(() -> parser.parse("not.a.jwt"));
		assertInvalid(() -> parser.parse(""));
		assertInvalid(() -> parser.parse(Jwts.builder().subject("not-a-uuid").id(session.toString())
				.expiration(Date.from(NOW.plusSeconds(60))).signWith(key, Jwts.SIG.HS256).compact()));
		assertInvalid(() -> parser.parse(Jwts.builder().subject(user.toString())
				.expiration(Date.from(NOW.plusSeconds(60))).signWith(key, Jwts.SIG.HS256).compact()));
	}

}
