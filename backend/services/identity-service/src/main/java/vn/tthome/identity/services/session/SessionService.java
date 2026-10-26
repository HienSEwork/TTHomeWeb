package vn.tthome.identity.services.session;

import java.util.UUID;

import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;

public interface SessionService {

	/** Starts a session: stores the hash of a new refresh token and returns it with a matching access token. */
	TokenPair issue(UserAccount user, boolean rememberMe, String deviceInfo, String ip);

	/**
	 * Rotates a refresh token: revokes it and issues a new pair with the same lifetime class (rememberMe or not).
	 * A token that was already revoked revokes every active session of its user.
	 *
	 * @throws vn.tthome.common.error.ApiException 401 TOKEN_INVALID for unknown, expired, revoked tokens and for
	 *         accounts that are no longer active.
	 */
	TokenPair refresh(String refreshToken, String deviceInfo, String ip);

	/** Revokes the session of this refresh token; unknown or already revoked tokens are ignored. */
	void logout(String refreshToken);

	/** Revokes every active session of the user. */
	void logoutAll(UUID userId);

	/** Revokes every active session of the user except the one with the given id (the own session of the caller). */
	void revokeOthers(UUID userId, UUID keepSessionId);

}
