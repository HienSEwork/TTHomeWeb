package vn.tthome.identity.services.contactnormalizer;

/** Turns user-typed phones and emails into the single stored form; invalid input is a 400 VALIDATION_ERROR. */
public interface ContactNormalizer {

	/** Vietnamese mobile number in any of 0xxxxxxxxx, 84xxxxxxxxx, +84xxxxxxxxx; returns +84xxxxxxxxx. */
	String phone(String raw);

	/** Trimmed, lower-cased email address. */
	String email(String raw);

	boolean looksLikeEmail(String identifier);

}
