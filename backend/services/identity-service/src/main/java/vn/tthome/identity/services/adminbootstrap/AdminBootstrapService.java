package vn.tthome.identity.services.adminbootstrap;

/** Sets up the very first administrator, who cannot be made through the API because no admin exists to do it. */
public interface AdminBootstrapService {

	/**
	 * Makes the account with this email an administrator, creating it (email already verified) with the given password
	 * when it does not exist. An existing account keeps its password. Does nothing once any administrator exists, so it
	 * is safe to run on every start.
	 *
	 * @param password only needed while there is no administrator; 8 to 128 characters.
	 * @return true when an administrator was created or promoted by this call.
	 * @throws IllegalArgumentException if a password is needed and is missing or has the wrong length.
	 */
	boolean ensureFirstAdmin(String email, String password);

}
