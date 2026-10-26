package vn.tthome.identity.services.password.impl;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.ChangePasswordRequest;
import vn.tthome.identity.models.dtos.ResetPasswordRequest;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;
import vn.tthome.identity.services.otp.OtpService;
import vn.tthome.identity.services.password.PasswordService;
import vn.tthome.identity.services.session.SessionService;

/** Not transactional as a whole: OtpService.verify must commit a wrong attempt even though the request fails. */
@Service
public class PasswordServiceImpl implements PasswordService {

	private final ContactNormalizer normalizer;
	private final OtpService otp;
	private final AccountService accounts;
	private final SessionService sessions;

	public PasswordServiceImpl(ContactNormalizer normalizer, OtpService otp, AccountService accounts,
			SessionService sessions) {
		this.normalizer = normalizer;
		this.otp = otp;
		this.accounts = accounts;
		this.sessions = sessions;
	}

	@Override
	public void forgot(String identifier, String ip) {
		boolean email = normalizer.looksLikeEmail(identifier);
		String target = email ? normalizer.email(identifier) : normalizer.phone(identifier);
		OtpChannel channel = email ? OtpChannel.EMAIL : OtpChannel.SMS;
		if (find(email, target).filter(u -> u.getStatus() == UserStatus.ACTIVE).isPresent()) {
			otp.request(target, OtpPurpose.RESET_PASSWORD, channel, ip);
		} else {
			otp.reserve(target, OtpPurpose.RESET_PASSWORD, channel, ip);
		}
	}

	@Override
	public void reset(ResetPasswordRequest request) {
		boolean email = normalizer.looksLikeEmail(request.identifier());
		String target = email ? normalizer.email(request.identifier()) : normalizer.phone(request.identifier());
		otp.verify(target, OtpPurpose.RESET_PASSWORD, request.code());
		UserAccount user = find(email, target)
				.orElseThrow(() -> new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Invalid or expired code"));
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
		}
		accounts.resetPassword(user, request.newPassword(), email);
		sessions.logoutAll(user.getId());
	}

	@Override
	public void change(AccessClaims caller, ChangePasswordRequest request) {
		UserAccount user = accounts.findById(caller.userId())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_INVALID", "Invalid or expired token"));
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
		}
		if (user.getPasswordHash() == null) {
			throw new ApiException(HttpStatus.CONFLICT, "PASSWORD_NOT_SET", "Use password reset to set a password");
		}
		accounts.requireCurrentPassword(user, request.currentPassword());
		accounts.changePassword(user.getId(), request.newPassword());
		sessions.revokeOthers(user.getId(), caller.sessionId());
	}

	private Optional<UserAccount> find(boolean email, String target) {
		return email ? accounts.findByEmail(target) : accounts.findByPhone(target);
	}

}
