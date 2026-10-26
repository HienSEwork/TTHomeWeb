package vn.tthome.identity.services;

import java.time.Instant;
import java.util.Collection;
import java.util.UUID;

import vn.tthome.identity.models.dtos.AccessClaims;

public interface JwtService {

	/** @param sessionId id of the refresh_token row backing this access token; stored as the {@code jti} claim. */
	String issueAccessToken(UUID userId, UUID sessionId, Collection<String> roles);

	/** @throws vn.tthome.common.error.ApiException 401 TOKEN_INVALID for expired, tampered or malformed tokens. */
	AccessClaims parse(String token);

	Instant expiresAt(String token);

}
