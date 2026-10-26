package vn.tthome.identity.services.contact;

import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.ChangeContactRequest;
import vn.tthome.identity.models.dtos.ConfirmContactRequest;

/** Changing the phone or email of the signed-in account, confirmed by a code sent to the new contact. */
public interface ContactService {

	/**
	 * Sends a code to the new contact. An account that has a password must send it; a contact that already belongs to
	 * another account gets the same 202 and no code.
	 *
	 * @throws vn.tthome.common.error.ApiException 401 INVALID_CREDENTIALS for a wrong current password.
	 */
	void requestChange(AccessClaims caller, ChangeContactRequest request, String ip);

	/**
	 * Verifies the code, stores the new contact as verified and revokes the caller's other sessions.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 OTP_INVALID, 409 CONTACT_TAKEN when someone took the contact meanwhile.
	 */
	void confirmChange(AccessClaims caller, ConfirmContactRequest request);

}
