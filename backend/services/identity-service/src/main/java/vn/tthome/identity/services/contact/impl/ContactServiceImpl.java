package vn.tthome.identity.services.contact.impl;

import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.ChangeContactRequest;
import vn.tthome.identity.models.dtos.ConfirmContactRequest;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.ContactType;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.contact.ContactService;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;
import vn.tthome.identity.services.otp.OtpService;
import vn.tthome.identity.services.session.SessionService;

/** Not transactional as a whole: OtpService.verify must commit a wrong attempt even though the request fails. */
@Service
public class ContactServiceImpl implements ContactService {

	private final ContactNormalizer normalizer;
	private final OtpService otp;
	private final AccountService accounts;
	private final SessionService sessions;

	public ContactServiceImpl(ContactNormalizer normalizer, OtpService otp, AccountService accounts,
			SessionService sessions) {
		this.normalizer = normalizer;
		this.otp = otp;
		this.accounts = accounts;
		this.sessions = sessions;
	}

	@Override
	public void requestChange(AccessClaims caller, ChangeContactRequest request, String ip) {
		UserAccount user = activeUser(caller);
		if (user.getPasswordHash() != null) {
			if (request.currentPassword() == null || request.currentPassword().isBlank()) {
				throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Current password is required");
			}
			accounts.requireCurrentPassword(user, request.currentPassword());
		}
		String target = normalize(request.type(), request.newValue());
		OtpChannel channel = request.type() == ContactType.PHONE ? OtpChannel.SMS : OtpChannel.EMAIL;
		boolean takenByAnother = owner(request.type(), target).filter(o -> !o.getId().equals(user.getId())).isPresent();
		if (takenByAnother) {
			otp.reserve(target, OtpPurpose.CHANGE_CONTACT, channel, ip);
		} else {
			otp.request(target, OtpPurpose.CHANGE_CONTACT, channel, ip);
		}
	}

	@Override
	public void confirmChange(AccessClaims caller, ConfirmContactRequest request) {
		UserAccount user = activeUser(caller);
		String target = normalize(request.type(), request.newValue());
		otp.verify(target, OtpPurpose.CHANGE_CONTACT, request.code());
		if (request.type() == ContactType.PHONE) {
			accounts.changePhone(user.getId(), target);
		} else {
			accounts.changeEmail(user.getId(), target);
		}
		sessions.revokeOthers(user.getId(), caller.sessionId());
	}

	private UserAccount activeUser(AccessClaims caller) {
		UserAccount user = accounts.findById(caller.userId())
				.orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_INVALID", "Invalid or expired token"));
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
		}
		return user;
	}

	private String normalize(ContactType type, String value) {
		return type == ContactType.PHONE ? normalizer.phone(value) : normalizer.email(value);
	}

	private Optional<UserAccount> owner(ContactType type, String target) {
		return type == ContactType.PHONE ? accounts.findByPhone(target) : accounts.findByEmail(target);
	}

}
