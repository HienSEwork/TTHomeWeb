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

	/** Finds a non-deleted account by its normalized phone. */
	Optional<UserAccount> findByPhone(String phone);

	/** Stamps the last login time. */
	void recordLogin(UserAccount user);

}
