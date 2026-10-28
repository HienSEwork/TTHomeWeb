package vn.tthome.search.models.mappers;

import vn.tthome.search.models.dtos.ListingItemResponse;
import vn.tthome.search.models.entities.ListingDoc;

public final class ListingMapper {

	private ListingMapper() {
	}

	public static ListingItemResponse toItem(ListingDoc d) {
		return new ListingItemResponse(d.roomId(), d.roomSlug(), d.projectName(), d.address(), d.roomType(),
				d.price() == null ? null : d.price().longValue(), d.priceInclUtility(),
				d.areaM2() == null ? null : d.areaM2().doubleValue(), d.furniture(), d.hasBalcony(), d.hasWindow(),
				d.isExclusive(), d.isPromo(), d.petPolicy(), d.evParking(), d.amenityIds(), d.coverUrl(), d.lat(),
				d.lng(), d.listedAt());
	}

}
