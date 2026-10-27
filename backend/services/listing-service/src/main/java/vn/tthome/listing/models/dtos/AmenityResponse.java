package vn.tthome.listing.models.dtos;

import vn.tthome.listing.models.entities.Amenity;

public record AmenityResponse(short id, String code, String name, String scope, String icon, short sortOrder,
		boolean filter) {

	public static AmenityResponse from(Amenity amenity) {
		return new AmenityResponse(amenity.getId(), amenity.getCode(), amenity.getName(), amenity.getScope(),
				amenity.getIcon(), amenity.getSortOrder(), amenity.isFilter());
	}

}
