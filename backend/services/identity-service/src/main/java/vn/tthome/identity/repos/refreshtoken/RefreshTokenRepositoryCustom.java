package vn.tthome.identity.repos.refreshtoken;

import java.time.Instant;
import java.util.UUID;

public interface RefreshTokenRepositoryCustom {

	/** Revokes every active token of the user in one statement; returns how many rows changed. */
	int revokeAllActive(UUID userId, Instant now);

	/** Revokes one token only if it is still active; exactly one concurrent caller gets true. */
	boolean revokeIfActive(UUID id, Instant now);

	/** Records which token replaced a rotated one, which is what makes a later reuse of it a theft signal. */
	void markReplaced(UUID id, UUID replacedBy);

	/** Same as {@link #revokeAllActive} but keeps the session with the given id. */
	int revokeAllActiveExcept(UUID userId, UUID keepId, Instant now);

}
