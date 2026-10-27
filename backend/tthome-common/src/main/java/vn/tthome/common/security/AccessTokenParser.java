package vn.tthome.common.security;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.http.HttpStatus;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vn.tthome.common.error.ApiException;

/** Verifies the HS256 access tokens of identity-service; the secret is the same JWT_SECRET it signs with. */
public class AccessTokenParser {

	private final JwtParser parser;

	public AccessTokenParser(String secret, Clock clock) {
		SecretKey key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
		this.parser = Jwts.parser().verifyWith(key).clock(() -> Date.from(clock.instant())).build();
	}

	/** @throws ApiException 401 TOKEN_INVALID for a malformed, forged or expired token. */
	public AccessClaims parse(String token) {
		try {
			Claims claims = parser.parseSignedClaims(token).getPayload();
			@SuppressWarnings("unchecked")
			List<String> roles = claims.get("roles", List.class);
			return new AccessClaims(UUID.fromString(claims.getSubject()), UUID.fromString(claims.getId()),
					roles == null ? List.of() : List.copyOf(roles));
		} catch (RuntimeException e) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_INVALID", "Invalid or expired token");
		}
	}

}
