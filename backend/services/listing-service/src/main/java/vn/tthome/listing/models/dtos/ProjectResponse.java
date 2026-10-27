package vn.tthome.listing.models.dtos;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import vn.tthome.listing.models.entities.Amenity;
import vn.tthome.listing.models.entities.Project;

public record ProjectResponse(UUID id, String code, String name, String slug, String streetAddress, Integer wardId,
		Integer wardNewId, Integer districtId, Double lat, Double lng, UUID ownerUserId, UUID managerUserId,
		boolean exclusive, String petPolicy, boolean evParking, Boolean freeHours, String maxGuestsNote,
		String houseRules, Long feeElectric, Long feeWater, Long feeService, Long feeParking, String feeNote,
		String description, UUID coverAssetId, UUID videoAssetId, String status, int vacantCount, int totalRooms,
		Long minPrice, List<Short> amenityIds) {

	public static ProjectResponse from(Project p) {
		return new ProjectResponse(p.getId(), p.getCode(), p.getName(), p.getSlug(), p.getStreetAddress(),
				p.getWardId(), p.getWardNewId(), p.getDistrictId(), p.getLat(), p.getLng(), p.getOwnerUserId(),
				p.getManagerUserId(), p.isExclusive(), p.getPetPolicy(), p.isEvParking(), p.getFreeHours(),
				p.getMaxGuestsNote(), p.getHouseRules(), dong(p.getFeeElectric()), dong(p.getFeeWater()), dong(p.getFeeService()),
				dong(p.getFeeParking()), p.getFeeNote(), p.getDescription(), p.getCoverAssetId(), p.getVideoAssetId(),
				p.getStatus(), p.getVacantCount(), p.getTotalRooms(), dong(p.getMinPrice()),
				p.getAmenities().stream().map(Amenity::getId).sorted().toList());
	}

	/** Money columns are whole dong stored as numeric(12,0). */
	static Long dong(BigDecimal amount) {
		return amount == null ? null : amount.longValueExact();
	}

}
