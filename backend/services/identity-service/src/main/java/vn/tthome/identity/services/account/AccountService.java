package vn.tthome.identity.services.account;

import java.util.Optional;
import java.util.UUID;

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

	/** Finds a non-deleted account by id. */
	Optional<UserAccount> findById(UUID id);

	/** Stamps the last login time and clears the failed-login counter and any expired lock. */
	void recordLogin(UserAccount user);

	/**
	 * Stores a new password, clears the failed-login counter and any lock, and marks the contact that proved ownership
	 * (email when viaEmail is true, otherwise phone) as verified.
	 */
	void resetPassword(UserAccount user, String newPassword, boolean viaEmail);

	/**
	 * Checks the password of a signed-in user before a sensitive change. A wrong password counts toward the lockout.
	 *
	 * @throws vn.tthome.common.error.ApiException 401 INVALID_CREDENTIALS, 423 ACCOUNT_LOCKED.
	 */
	void requireCurrentPassword(UserAccount user, String password);

	/** Stores a new password without touching verification or lockout state. */
	void changePassword(UUID userId, String newPassword);

	/** Replaces the phone with a verified one; 409 CONTACT_TAKEN when another account owns it. */
	void changePhone(UUID userId, String phone);

	/** Replaces the email with a verified one; 409 CONTACT_TAKEN when another account owns it. */
	void changeEmail(UUID userId, String email);

	/** Counts a wrong password and locks the account once the configured number of failures is reached. */
	void recordFailedLogin(UserAccount user);

}
