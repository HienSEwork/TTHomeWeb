package vn.tthome.identity.services.password;

import vn.tthome.identity.models.dtos.ResetPasswordRequest;

/** Recovering access with a one-time code when the password is forgotten. */
public interface PasswordService {

	/** Same outcome for known and unknown identifiers; a code goes only to an active account's phone or email. */
	void forgot(String identifier, String ip);

	/**
	 * Verifies the code, stores the new password, clears any lockout, marks the contact the code went to as verified
	 * and revokes every session of the user.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 OTP_INVALID for a wrong, expired or used code.
	 */
	void reset(ResetPasswordRequest request);

}
