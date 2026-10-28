package vn.tthome.common.security;

import java.util.List;
import java.util.UUID;

/** The identity of a request, read from the access token that identity-service issued. */
public record AccessClaims(UUID userId, UUID sessionId, List<String> roles) implements Actor {
}
