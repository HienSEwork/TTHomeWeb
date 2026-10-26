package vn.tthome.identity.services.account.impl;

import java.time.Clock;
import java.util.Optional;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.passwordhasher.PasswordHasher;

@Service
public class AccountServiceImpl implements AccountService {

	private static final String DEFAULT_ROLE = "TENANT";

	private final UserAccountRepository users;
	private final RoleRepository roles;
	private final PasswordHasher hasher;
	private final Clock clock;

	public AccountServiceImpl(UserAccountRepository users, RoleRepository roles, PasswordHasher hasher, Clock clock) {
		this.users = users;
		this.roles = roles;
		this.hasher = hasher;
		this.clock = clock;
	}

	@Override
	@Transactional
	public UserAccount createPhoneAccount(String phone, String fullName, String passwordOrNull) {
		UserAccount user = new UserAccount();
		user.setPhone(phone);
		user.setFullName(fullName);
		user.setPhoneVerifiedAt(clock.instant());
		if (passwordOrNull != null) {
			user.setPasswordHash(hasher.hash(passwordOrNull));
		}
		user.getRoles().add(roles.findByCode(DEFAULT_ROLE).orElseThrow());
		try {
			return users.saveAndFlush(user);
		} catch (DataIntegrityViolationException e) {
			throw new ApiException(HttpStatus.CONFLICT, "CONTACT_TAKEN", "Contact already in use");
		}
	}

	@Override
	@Transactional
	public Optional<UserAccount> registerUnverifiedEmailAccount(String email, String password, String fullName) {
		Optional<UserAccount> existing = users.findByEmailIgnoreCaseAndDeletedAtIsNull(email);
		if (existing.isPresent()) {
			UserAccount pending = existing.get();
			if (pending.getEmailVerifiedAt() != null || pending.getPhoneVerifiedAt() != null) {
				return Optional.empty();
			}
			pending.setPasswordHash(hasher.hash(password));
			pending.setFullName(fullName);
			return Optional.of(pending);
		}
		UserAccount user = new UserAccount();
		user.setEmail(email);
		user.setFullName(fullName);
		user.setPasswordHash(hasher.hash(password));
		user.getRoles().add(roles.findByCode(DEFAULT_ROLE).orElseThrow());
		try {
			return Optional.of(users.saveAndFlush(user));
		} catch (DataIntegrityViolationException e) {
			return Optional.empty(); // a concurrent registration of the same email won
		}
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserAccount> findByEmail(String email) {
		return users.findByEmailIgnoreCaseAndDeletedAtIsNull(email);
	}

	@Override
	@Transactional
	public void markEmailVerified(UserAccount user) {
		users.findById(user.getId()).ifPresent(u -> {
			if (u.getEmailVerifiedAt() == null) {
				u.setEmailVerifiedAt(clock.instant());
			}
		});
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserAccount> findByPhone(String phone) {
		return users.findByPhoneAndDeletedAtIsNull(phone);
	}

	@Override
	@Transactional
	public void recordLogin(UserAccount user) {
		users.findById(user.getId()).ifPresent(u -> u.setLastLoginAt(clock.instant()));
	}

}
