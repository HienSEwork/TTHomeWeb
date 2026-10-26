package vn.tthome.identity.models.enums;

import jakarta.persistence.Converter;

public enum OtpPurpose implements DbValue {

	REGISTER("register"),
	LOGIN("login"),
	RESET_PASSWORD("reset_password"),
	CHANGE_CONTACT("change_contact");

	private final String value;

	OtpPurpose(String value) {
		this.value = value;
	}

	@Override
	public String value() {
		return value;
	}

	@Converter(autoApply = true)
	public static class DbConverter extends DbValueConverter<OtpPurpose> {

		public DbConverter() {
			super(OtpPurpose.class);
		}

	}

}
