package vn.tthome.identity.services.account.impl;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.config.AuthProperties;
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
	private final AuthProperties props;

	public AccountServiceImpl(UserAccountRepository users, RoleRepository roles, PasswordHasher hasher, Clock clock,
			AuthProperties props) {
		this.users = users;
		this.roles = roles;
		this.hasher = hasher;
		this.clock = clock;
		this.props = props;
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
	public UserAccount createEmailAccount(String email, String fullName, String password) {
		UserAccount user = new UserAccount();
		user.setEmail(email);
		user.setFullName(fullName);
		user.setEmailVerifiedAt(clock.instant());
		user.setPasswordHash(hasher.hash(password));
		user.getRoles().add(roles.findByCode(DEFAULT_ROLE).orElseThrow());
		try {
			return users.saveAndFlush(user);
		} catch (DataIntegrityViolationException e) {
			throw new ApiException(HttpStatus.CONFLICT, "CONTACT_TAKEN", "Contact already in use");
		}
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserAccount> findByEmail(String email) {
		return users.findActiveByEmail(email);
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserAccount> findByPhone(String phone) {
		return users.findByPhoneAndDeletedAtIsNull(phone);
	}

	@Override
	@Transactional
	public void recordLogin(UserAccount user) {
		users.recordLogin(user.getId(), clock.instant());
	}

	@Override
	@Transactional
	public void resetPassword(UserAccount user, String newPassword, boolean viaEmail) {
		users.findById(user.getId()).ifPresent(u -> {
			Instant now = clock.instant();
			u.setPasswordHash(hasher.hash(newPassword));
			u.setFailedLoginCount((short) 0);
			u.setLockedUntil(null);
			if (viaEmail && u.getEmailVerifiedAt() == null) {
				u.setEmailVerifiedAt(now);
			} else if (!viaEmail && u.getPhoneVerifiedAt() == null) {
				u.setPhoneVerifiedAt(now);
			}
		});
	}

	/** The attempt is counted before the check and must stay counted when the request fails: no rollback on ApiException. */
	@Override
	@Transactional(noRollbackFor = ApiException.class)
	public void authenticate(UserAccount user, String password) {
		Instant now = clock.instant();
		if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
			throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED", "Account is temporarily locked");
		}
		int attempt = users.beginLoginAttempt(user.getId(), props.maxFailedLogins(), now, now.plus(props.lockDuration()));
		if (attempt > props.maxFailedLogins()) {
			throw new ApiException(HttpStatus.LOCKED, "ACCOUNT_LOCKED", "Account is temporarily locked");
		}
		if (user.getPasswordHash() == null || !hasher.verify(user.getPasswordHash(), password)) {
			throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "Invalid credentials");
		}
		users.clearLoginAttempts(user.getId(), now);
	}

	@Override
	@Transactional
	public void changePassword(UUID userId, String newPassword) {
		users.findById(userId).ifPresent(u -> u.setPasswordHash(hasher.hash(newPassword)));
	}

	@Override
	@Transactional
	public void changePhone(UUID userId, String phone) {
		users.findById(userId).ifPresent(u -> {
			u.setPhone(phone);
			u.setPhoneVerifiedAt(clock.instant());
			saveOrConflict(u);
		});
	}

	@Override
	@Transactional
	public void changeEmail(UUID userId, String email) {
		users.findById(userId).ifPresent(u -> {
			u.setEmail(email);
			u.setEmailVerifiedAt(clock.instant());
			saveOrConflict(u);
		});
	}

	private void saveOrConflict(UserAccount user) {
		try {
			users.saveAndFlush(user);
		} catch (DataIntegrityViolationException e) {
			throw new ApiException(HttpStatus.CONFLICT, "CONTACT_TAKEN", "Contact already in use");
		}
	}

	@Override
	@Transactional(readOnly = true)
	public Optional<UserAccount> findById(UUID id) {
		return users.findById(id).filter(u -> u.getDeletedAt() == null);
	}

}
