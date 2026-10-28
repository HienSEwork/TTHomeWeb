package vn.tthome.search.models.dtos;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record ListingItemResponse(
		UUID roomId,
		String roomSlug,
		String projectName,
		String address,
		String roomType,
		Long price,
		Boolean priceInclUtility,
		Double areaM2,
		String furniture,
		Boolean hasBalcony,
		Boolean hasWindow,
		boolean isExclusive,
		boolean isPromo,
		String petPolicy,
		Boolean evParking,
		List<Short> amenityIds,
		String coverUrl,
		Double lat,
		Double lng,
		OffsetDateTime listedAt) {

}
