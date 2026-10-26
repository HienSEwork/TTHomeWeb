package vn.tthome.identity.models.enums;

import jakarta.persistence.Converter;

public enum UserStatus implements DbValue {

	ACTIVE("active"),
	LOCKED("locked"),
	DISABLED("disabled"),
	PENDING_DELETE("pending_delete");

	private final String value;

	UserStatus(String value) {
		this.value = value;
	}

	@Override
	public String value() {
		return value;
	}

	@Converter(autoApply = true)
	public static class DbConverter extends DbValueConverter<UserStatus> {

		public DbConverter() {
			super(UserStatus.class);
		}

	}

}
