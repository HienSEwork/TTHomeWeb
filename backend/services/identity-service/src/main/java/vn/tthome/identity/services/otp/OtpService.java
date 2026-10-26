package vn.tthome.identity.services.otp;

import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;

public interface OtpService {

	/**
	 * Creates and sends a one-time code.
	 *
	 * @throws vn.tthome.common.error.ApiException 429 OTP_RATE_LIMITED when a cooldown or hourly limit is hit.
	 */
	void request(String target, OtpPurpose purpose, OtpChannel channel, String ip);

	/**
	 * Applies the same limits as {@link #request} and stores a challenge, but sends nothing and no code can match it.
	 * Used for unknown or already registered targets so that the response and the limits look the same as for a real request.
	 */
	void reserve(String target, OtpPurpose purpose, OtpChannel channel, String ip);

	/**
	 * Consumes the newest open challenge of the target and purpose when the code matches.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 OTP_INVALID for a wrong, expired, used or missing code.
	 */
	void verify(String target, OtpPurpose purpose, String code);

}
