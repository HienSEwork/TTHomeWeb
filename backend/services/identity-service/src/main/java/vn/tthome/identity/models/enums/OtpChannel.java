package vn.tthome.identity.models.enums;

import jakarta.persistence.Converter;

public enum OtpChannel implements DbValue {

	SMS("sms"),
	ZALO("zalo"),
	EMAIL("email");

	private final String value;

	OtpChannel(String value) {
		this.value = value;
	}

	@Override
	public String value() {
		return value;
	}

	@Converter(autoApply = true)
	public static class DbConverter extends DbValueConverter<OtpChannel> {

		public DbConverter() {
			super(OtpChannel.class);
		}

	}

}
