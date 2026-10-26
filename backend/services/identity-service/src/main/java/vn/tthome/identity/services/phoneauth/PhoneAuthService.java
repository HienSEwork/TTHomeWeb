package vn.tthome.identity.services.phoneauth;

import vn.tthome.identity.models.dtos.OtpLoginVerifyRequest;
import vn.tthome.identity.models.dtos.PhoneVerifyRequest;
import vn.tthome.identity.models.dtos.TokenPair;

/** Registration and sign-in by phone number and one-time code. */
public interface PhoneAuthService {

	/** Always completes the same way for known and unknown phones; sends a code only to an unregistered phone. */
	void requestRegistration(String phone, String ip);

	TokenPair verifyRegistration(PhoneVerifyRequest request, String deviceInfo, String ip);

	/** Always completes the same way for known and unknown phones; sends a code only to an active account. */
	void requestLogin(String phone, String ip);

	TokenPair verifyLogin(OtpLoginVerifyRequest request, String deviceInfo, String ip);

}
