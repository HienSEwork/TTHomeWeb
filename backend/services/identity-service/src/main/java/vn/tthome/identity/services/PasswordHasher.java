package vn.tthome.identity.services;

public interface PasswordHasher {

	String hash(String raw);

	boolean verify(String hash, String raw);

	/** Spends the same time as {@link #verify} so an unknown account is not distinguishable by timing. */
	void verifyDummy(String raw);

}
