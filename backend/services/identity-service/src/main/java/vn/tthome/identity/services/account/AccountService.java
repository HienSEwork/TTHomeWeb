package vn.tthome.identity.services.account;

import java.util.Optional;

import vn.tthome.identity.models.entities.UserAccount;

public interface AccountService {

	/**
	 * Creates a TENANT account whose phone is already verified; the password is optional.
	 *
	 * @throws vn.tthome.common.error.ApiException 409 CONTACT_TAKEN when the phone is already registered.
	 */
	UserAccount createPhoneAccount(String phone, String fullName, String passwordOrNull);

	/**
	 * Registers an account whose email is not verified yet, or refreshes the password and name of a still-unverified one
	 * (the latest registrant wins, so a stranger cannot pre-claim someone else's address).
	 *
	 * @return the pending account, or empty when a verified account already uses that email.
	 */
	Optional<UserAccount> registerUnverifiedEmailAccount(String email, String password, String fullName);

	/** Finds a non-deleted account by its normalized email. */
	Optional<UserAccount> findByEmail(String email);

	/** Marks the email as verified (idempotent). */
	void markEmailVerified(UserAccount user);

	/** Finds a non-deleted account by its normalized phone. */
	Optional<UserAccount> findByPhone(String phone);

	/** Stamps the last login time. */
	void recordLogin(UserAccount user);

}
