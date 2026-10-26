package vn.tthome.identity.services.login.impl;

import java.time.Clock;
import java.util.Optional;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.LoginRequest;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;
import vn.tthome.identity.services.login.LoginService;
import vn.tthome.identity.services.passwordhasher.PasswordHasher;
import vn.tthome.identity.services.session.SessionService;

@Service
public class LoginServiceImpl implements LoginService {

	private final ContactNormalizer normalizer;
	private final AccountService accounts;
	private final PasswordHasher hasher;
	private final SessionService sessions;
	private final Clock clock;

	public LoginServiceImpl(ContactNormalizer normalizer, AccountService accounts, PasswordHasher hasher,
			SessionService sessions, Clock clock) {
		this.normalizer = normalizer;
		this.accounts = accounts;
		this.hasher = hasher;
		this.sessions = sessions;
		this.clock = clock;
	}

	@Override
	public TokenPair login(LoginRequest request, String deviceInfo, String ip) {
		String identifier = request.identifier().trim();
		Optional<UserAccount> found = normalizer.looksLikeEmail(identifier)
				? accounts.findByEmail(normalizer.email(identifier))
				: accounts.findByPhone(normalizer.phone(identifier));
		if (found.isEmpty() || found.get().getPasswordHash() == null) {
			hasher.verifyDummy(request.password());
			throw invalidCredentials();
		}
		UserAccount user = found.get();
		if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(clock.instant())) {
			throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED", "Account is temporarily locked");
		}
		if (!hasher.verify(user.getPasswordHash(), request.password())) {
			accounts.recordFailedLogin(user);
			throw invalidCredentials();
		}
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
		}
		if (user.getEmailVerifiedAt() == null && user.getPhoneVerifiedAt() == null) {
			throw new ApiException(HttpStatus.FORBIDDEN, "EMAIL_NOT_VERIFIED", "Email address is not verified");
		}
		accounts.recordLogin(user);
		return sessions.issue(user, request.remember(), deviceInfo, ip);
	}

	private static ApiException invalidCredentials() {
		return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials");
	}

}
