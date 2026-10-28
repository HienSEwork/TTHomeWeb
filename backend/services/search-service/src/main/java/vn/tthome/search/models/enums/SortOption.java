package vn.tthome.search.models.enums;

import java.util.Arrays;
import java.util.Optional;

public enum SortOption {

	NEWEST("listed_at DESC"),
	PRICE_ASC("price ASC NULLS LAST"),
	PRICE_DESC("price DESC NULLS LAST"),
	POPULAR("rank_score DESC");

	private final String orderBy;

	SortOption(String orderBy) {
		this.orderBy = orderBy;
	}

	/** Trusted SQL fragment (never built from user input); room_id is appended as a stable tie-breaker. */
	public String orderBy() {
		return orderBy;
	}

	public static Optional<SortOption> parse(String value) {
		if (value == null) {
			return Optional.empty();
		}
		return Arrays.stream(values()).filter(s -> s.name().equalsIgnoreCase(value.trim())).findFirst();
	}

}
