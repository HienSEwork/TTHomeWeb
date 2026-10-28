package vn.tthome.search.models.enums;

import java.util.Arrays;
import java.util.Optional;

/** Room types as stored in {@code search.listing_doc.room_type}. */
public enum RoomType {

	STUDIO("studio"),
	DUPLEX("duplex"),
	ONE_BED("1pn"),
	TWO_BED("2pn"),
	THREE_BED("3pn"),
	SHARED("shared"),
	DORM("dorm"),
	ROOM("room");

	private final String dbValue;

	RoomType(String dbValue) {
		this.dbValue = dbValue;
	}

	public String dbValue() {
		return dbValue;
	}

	/** Accepts both the database value ({@code 1pn}) and the enum name ({@code ONE_BED}), case-insensitive. */
	public static Optional<RoomType> parse(String value) {
		if (value == null) {
			return Optional.empty();
		}
		String v = value.trim();
		return Arrays.stream(values())
				.filter(t -> t.dbValue.equalsIgnoreCase(v) || t.name().equalsIgnoreCase(v))
				.findFirst();
	}

}
