package vn.tthome.identity.services.emailauth;

import vn.tthome.identity.models.dtos.EmailRegisterRequest;
import vn.tthome.identity.models.dtos.EmailVerifyRequest;
import vn.tthome.identity.models.dtos.TokenPair;

/** Registration by email: the account is created only once the code sent to the address has been confirmed. */
public interface EmailAuthService {

	/** Same outcome for new and already registered addresses; a code is sent only for an unregistered address. */
	void register(EmailRegisterRequest request, String ip);

	/** Confirms the code and, only then, creates the account with the chosen password and signs it in. */
	TokenPair verify(EmailVerifyRequest request, String deviceInfo, String ip);

}
