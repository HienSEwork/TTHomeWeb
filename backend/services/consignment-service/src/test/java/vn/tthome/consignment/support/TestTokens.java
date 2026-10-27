package vn.tthome.consignment.support;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

/** Access tokens signed the way identity-service signs them, with the secret of application-test.yml. */
public final class TestTokens {

	public static final String SECRET = "test-only-jwt-secret-0123456789-abcdefghij";

	private TestTokens() {
	}

	public static String bearer(String... roles) {
		return bearerFor(UUID.randomUUID(), roles);
	}

	/** A token for a known user, for tests that check who did what. */
	public static String bearerFor(UUID user, String... roles) {
		Instant now = Instant.now();
		return "Bearer " + Jwts.builder().subject(user.toString()).id(UUID.randomUUID().toString())
				.claim("roles", List.of(roles)).issuedAt(Date.from(now)).expiration(Date.from(now.plus(Duration.ofMinutes(5))))
				.signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8)), Jwts.SIG.HS256).compact();
	}

	public static String admin() {
		return bearer("ADMIN");
	}

}
