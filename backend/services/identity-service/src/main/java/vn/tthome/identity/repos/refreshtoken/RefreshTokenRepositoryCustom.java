package vn.tthome.identity.repos.refreshtoken;

import java.time.Instant;
import java.util.UUID;

public interface RefreshTokenRepositoryCustom {

	/** Revokes every active token of the user in one statement; returns how many rows changed. */
	int revokeAllActive(UUID userId, Instant now);

	/** Same as {@link #revokeAllActive} but keeps the session with the given id. */
	int revokeAllActiveExcept(UUID userId, UUID keepId, Instant now);

}
