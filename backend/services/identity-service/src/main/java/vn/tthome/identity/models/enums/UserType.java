package vn.tthome.identity.models.enums;

import jakarta.persistence.Converter;

public enum UserType implements DbValue {

	TENANT("tenant"),
	LANDLORD("landlord"),
	AGENT("agent"),
	CONSULTANT("consultant"),
	ADMIN("admin");

	private final String value;

	UserType(String value) {
		this.value = value;
	}

	@Override
	public String value() {
		return value;
	}

	@Converter(autoApply = true)
	public static class DbConverter extends DbValueConverter<UserType> {

		public DbConverter() {
			super(UserType.class);
		}

	}

}
