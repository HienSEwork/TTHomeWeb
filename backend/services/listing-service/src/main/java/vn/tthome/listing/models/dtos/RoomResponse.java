package vn.tthome.listing.models.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import vn.tthome.listing.models.entities.Amenity;
import vn.tthome.listing.models.entities.Room;

public record RoomResponse(UUID id, UUID projectId, String code, String title, String slug, String roomType,
		Short floor, BigDecimal areaM2, Long price, boolean priceInclUtility, Long deposit, String furniture,
		Boolean hasBalcony, Boolean hasWindow, Short maxOccupants, String status, LocalDate availableFrom,
		boolean promo, String promoNote, UUID coverAssetId, List<Short> amenityIds) {

	public static RoomResponse from(Room r) {
		return new RoomResponse(r.getId(), r.getProjectId(), r.getCode(), r.getTitle(), r.getSlug(), r.getRoomType(),
				r.getFloor(), r.getAreaM2(), dong(r.getPrice()), r.isPriceInclUtility(), dong(r.getDeposit()),
				r.getFurniture(), r.getHasBalcony(), r.getHasWindow(), r.getMaxOccupants(), r.getStatus(),
				r.getAvailableFrom(), r.isPromo(), r.getPromoNote(), r.getCoverAssetId(),
				r.getAmenities().stream().map(Amenity::getId).sorted().toList());
	}

	/** Money columns are whole dong stored as numeric(12,0). */
	static Long dong(BigDecimal amount) {
		return amount == null ? null : amount.longValueExact();
	}

}
