package vn.tthome.identity.services.emailauth.impl;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.EmailRegisterRequest;
import vn.tthome.identity.models.dtos.EmailVerifyRequest;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;
import vn.tthome.identity.services.emailauth.EmailAuthService;
import vn.tthome.identity.services.otp.OtpService;
import vn.tthome.identity.services.session.SessionService;

/** Not transactional as a whole, for the same reason as PhoneAuthServiceImpl: wrong attempts must be committed. */
@Service
public class EmailAuthServiceImpl implements EmailAuthService {

	private final ContactNormalizer normalizer;
	private final OtpService otp;
	private final AccountService accounts;
	private final SessionService sessions;

	public EmailAuthServiceImpl(ContactNormalizer normalizer, OtpService otp, AccountService accounts,
			SessionService sessions) {
		this.normalizer = normalizer;
		this.otp = otp;
		this.accounts = accounts;
		this.sessions = sessions;
	}

	@Override
	public void register(EmailRegisterRequest request, String ip) {
		String email = normalizer.email(request.email());
		if (accounts.registerUnverifiedEmailAccount(email, request.password(), request.fullName()).isPresent()) {
			otp.request(email, OtpPurpose.REGISTER, OtpChannel.EMAIL, ip);
		} else {
			otp.reserve(email, OtpPurpose.REGISTER, OtpChannel.EMAIL, ip);
		}
	}

	@Override
	public TokenPair verify(EmailVerifyRequest request, String deviceInfo, String ip) {
		String email = normalizer.email(request.email());
		otp.verify(email, OtpPurpose.REGISTER, request.code());
		UserAccount user = accounts.findByEmail(email)
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Invalid or expired code"));
		accounts.markEmailVerified(user);
		accounts.recordLogin(user);
		return sessions.issue(user, request.remember(), deviceInfo, ip);
	}

}
