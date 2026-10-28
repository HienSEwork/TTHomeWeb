package vn.tthome.search.models.dtos;

import java.util.List;

import vn.tthome.search.models.enums.RoomType;
import vn.tthome.search.models.enums.SortOption;

/**
 * Validated, normalised search criteria shared by search and map. {@code keyword} is already
 * lower-cased without diacritics; null fields mean "no constraint".
 */
public record SearchFilterRequest(
		String keyword,
		Long priceMin,
		Long priceMax,
		Integer districtId,
		Integer wardId,
		List<RoomType> roomTypes,
		List<Short> amenityIds,
		Double areaMin,
		Double areaMax,
		String furniture,
		Boolean hasBalcony,
		Boolean hasWindow,
		Boolean exclusive,
		boolean petFriendly,
		boolean evParking,
		boolean promo,
		SortOption sort,
		int page,
		int limit) {

	public static final int DEFAULT_LIMIT = 20;
	public static final int MAX_LIMIT = 50;

	public int offset() {
		return (page - 1) * limit;
	}

}
