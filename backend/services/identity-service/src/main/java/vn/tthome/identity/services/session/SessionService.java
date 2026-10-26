package vn.tthome.identity.services.session;

import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;

public interface SessionService {

	/** Starts a session: stores the hash of a new refresh token and returns it with a matching access token. */
	TokenPair issue(UserAccount user, boolean rememberMe, String deviceInfo, String ip);

}
