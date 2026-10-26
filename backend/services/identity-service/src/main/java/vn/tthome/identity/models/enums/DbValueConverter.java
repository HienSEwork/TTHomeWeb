package vn.tthome.identity.models.enums;

import jakarta.persistence.AttributeConverter;

public abstract class DbValueConverter<E extends Enum<E> & DbValue> implements AttributeConverter<E, String> {

	private final Class<E> type;

	protected DbValueConverter(Class<E> type) {
		this.type = type;
	}

	@Override
	public String convertToDatabaseColumn(E attribute) {
		return attribute == null ? null : attribute.value();
	}

	@Override
	public E convertToEntityAttribute(String dbData) {
		if (dbData == null) {
			return null;
		}
		for (E constant : type.getEnumConstants()) {
			if (constant.value().equals(dbData)) {
				return constant;
			}
		}
		throw new IllegalArgumentException("Unknown " + type.getSimpleName() + " value: " + dbData);
	}

}
