package vn.tthome.identity.services.phoneauth.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.OtpLoginVerifyRequest;
import vn.tthome.identity.models.dtos.PhoneVerifyRequest;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;
import vn.tthome.identity.services.otp.OtpService;
import vn.tthome.identity.services.phoneauth.PhoneAuthService;
import vn.tthome.identity.services.session.SessionService;

/**
 * Deliberately not transactional as a whole: OtpService.verify must commit a wrong attempt even though the request
 * fails, so each collaborator runs in its own transaction.
 */
@Service
public class PhoneAuthServiceImpl implements PhoneAuthService {

	private final ContactNormalizer normalizer;
	private final OtpService otp;
	private final AccountService accounts;
	private final SessionService sessions;

	public PhoneAuthServiceImpl(ContactNormalizer normalizer, OtpService otp, AccountService accounts,
			SessionService sessions) {
		this.normalizer = normalizer;
		this.otp = otp;
		this.accounts = accounts;
		this.sessions = sessions;
	}

	@Override
	public void requestRegistration(String phone, String ip) {
		String target = normalizer.phone(phone);
		if (accounts.findByPhone(target).isPresent()) {
			otp.reserve(target, OtpPurpose.REGISTER, OtpChannel.SMS, ip);
		} else {
			otp.request(target, OtpPurpose.REGISTER, OtpChannel.SMS, ip);
		}
	}

	@Override
	public TokenPair verifyRegistration(PhoneVerifyRequest request, String deviceInfo, String ip) {
		String target = normalizer.phone(request.phone());
		otp.verify(target, OtpPurpose.REGISTER, request.code());
		UserAccount user = accounts.createPhoneAccount(target, request.fullName(), request.password());
		return sessions.issue(user, request.remember(), deviceInfo, ip);
	}

	@Override
	public void requestLogin(String phone, String ip) {
		String target = normalizer.phone(phone);
		if (accounts.findByPhone(target).filter(PhoneAuthServiceImpl::isActive).isPresent()) {
			otp.request(target, OtpPurpose.LOGIN, OtpChannel.SMS, ip);
		} else {
			otp.reserve(target, OtpPurpose.LOGIN, OtpChannel.SMS, ip);
		}
	}

	@Override
	public TokenPair verifyLogin(OtpLoginVerifyRequest request, String deviceInfo, String ip) {
		String target = normalizer.phone(request.phone());
		otp.verify(target, OtpPurpose.LOGIN, request.code());
		UserAccount user = accounts.findByPhone(target)
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Invalid or expired code"));
		if (!isActive(user)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
		}
		accounts.recordLogin(user);
		return sessions.issue(user, request.remember(), deviceInfo, ip);
	}

	private static boolean isActive(UserAccount user) {
		return user.getStatus() == UserStatus.ACTIVE;
	}

}
