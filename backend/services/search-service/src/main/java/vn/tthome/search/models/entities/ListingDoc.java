package vn.tthome.search.models.entities;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/** One row of the denormalised read table {@code search.listing_doc} (one row per room). */
public record ListingDoc(
		UUID roomId,
		UUID projectId,
		String projectCode,
		String roomSlug,
		String projectName,
		String address,
		Integer wardId,
		Integer wardNewId,
		Integer districtId,
		Double lat,
		Double lng,
		String roomType,
		BigDecimal price,
		Boolean priceInclUtility,
		BigDecimal areaM2,
		String furniture,
		Boolean hasBalcony,
		Boolean hasWindow,
		boolean isExclusive,
		boolean isPromo,
		String petPolicy,
		Boolean evParking,
		List<Short> amenityIds,
		String coverUrl,
		String status,
		float rankScore,
		OffsetDateTime listedAt) {

}
