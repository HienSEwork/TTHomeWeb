package vn.tthome.identity.services.emailauth;

import vn.tthome.identity.models.dtos.EmailRegisterRequest;
import vn.tthome.identity.models.dtos.EmailVerifyRequest;
import vn.tthome.identity.models.dtos.TokenPair;

/** Registration with email and password, confirmed by a code sent to the address. */
public interface EmailAuthService {

	/** Same outcome for new and already registered addresses; a code is sent only for a pending registration. */
	void register(EmailRegisterRequest request, String ip);

	TokenPair verify(EmailVerifyRequest request, String deviceInfo, String ip);

}
