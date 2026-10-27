package vn.tthome.listing.models.dtos;

import vn.tthome.listing.models.entities.Landmark;

public record LandmarkResponse(short id, String code, String name, String kind, Double lat, Double lng, int radiusM,
		short sortOrder) {

	public static LandmarkResponse from(Landmark landmark) {
		return new LandmarkResponse(landmark.getId(), landmark.getCode(), landmark.getName(), landmark.getKind(),
				landmark.getLat(), landmark.getLng(), landmark.getRadiusM(), landmark.getSortOrder());
	}

}
