package vn.tthome.search.models.dtos;

import java.util.List;

/** Raw, unvalidated query-string values as received by the controllers. */
public record SearchParams(
		String q,
		Long priceMin,
		Long priceMax,
		Integer districtId,
		Integer wardId,
		List<String> roomType,
		List<Short> amenities,
		Double areaMin,
		Double areaMax,
		String furniture,
		Boolean balcony,
		Boolean window,
		Boolean exclusive,
		Boolean pet,
		Boolean evParking,
		Boolean promo,
		String sort,
		Integer page,
		Integer limit) {

}
