package vn.tthome.identity.services.login;

import vn.tthome.identity.models.dtos.LoginRequest;
import vn.tthome.identity.models.dtos.TokenPair;

public interface LoginService {

	/**
	 * Signs in with a phone or an email and a password.
	 *
	 * @throws vn.tthome.common.error.ApiException 401 INVALID_CREDENTIALS (identical for unknown account and wrong
	 *         password), 403 ACCOUNT_DISABLED.
	 */
	TokenPair login(LoginRequest request, String deviceInfo, String ip);

}
