package vn.tthome.identity.services.jwt.impl;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Collection;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import javax.crypto.SecretKey;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import vn.tthome.common.error.ApiException;
import vn.tthome.identity.config.AuthProperties;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.services.jwt.JwtService;

@Service
public class JwtServiceImpl implements JwtService {

	private final AuthProperties props;
	private final Clock clock;
	private final SecretKey key;
	private final JwtParser parser;

	public JwtServiceImpl(AuthProperties props, Clock clock) {
		this.props = props;
		this.clock = clock;
		this.key = Keys.hmacShaKeyFor(props.jwtSecret().getBytes(StandardCharsets.UTF_8));
		this.parser = Jwts.parser().verifyWith(key).clock(() -> Date.from(clock.instant())).build();
	}

	@Override
	public String issueAccessToken(UUID userId, UUID sessionId, Collection<String> roles) {
		Instant now = clock.instant();
		return Jwts.builder()
				.subject(userId.toString())
				.id(sessionId.toString())
				.claim("roles", List.copyOf(roles))
				.issuedAt(Date.from(now))
				.expiration(Date.from(now.plus(props.accessTtl())))
				.signWith(key, Jwts.SIG.HS256)
				.compact();
	}

	@Override
	public AccessClaims parse(String token) {
		Claims claims = claimsOf(token);
		try {
			@SuppressWarnings("unchecked")
			List<String> roles = claims.get("roles", List.class);
			return new AccessClaims(UUID.fromString(claims.getSubject()), UUID.fromString(claims.getId()),
					roles == null ? List.of() : List.copyOf(roles));
		} catch (RuntimeException e) {
			throw invalid();
		}
	}

	@Override
	public Instant expiresAt(String token) {
		return claimsOf(token).getExpiration().toInstant();
	}

	private Claims claimsOf(String token) {
		try {
			return parser.parseSignedClaims(token).getPayload();
		} catch (RuntimeException e) {
			throw invalid();
		}
	}

	private static ApiException invalid() {
		return new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_INVALID", "Invalid or expired token");
	}

}
