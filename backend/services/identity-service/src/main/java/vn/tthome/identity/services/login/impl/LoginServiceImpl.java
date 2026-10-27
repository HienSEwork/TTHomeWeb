package vn.tthome.identity.services.login.impl;

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

	public LoginServiceImpl(ContactNormalizer normalizer, AccountService accounts, PasswordHasher hasher,
			SessionService sessions) {
		this.normalizer = normalizer;
		this.accounts = accounts;
		this.hasher = hasher;
		this.sessions = sessions;
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
		accounts.authenticate(user, request.password());
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw new ApiException(HttpStatus.FORBIDDEN, "ACCOUNT_DISABLED", "Account is not active");
		}
		accounts.recordLogin(user);
		return sessions.issue(user, request.remember(), deviceInfo, ip);
	}

	private static ApiException invalidCredentials() {
		return new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials");
	}

}
