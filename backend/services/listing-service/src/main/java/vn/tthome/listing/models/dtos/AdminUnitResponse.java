package vn.tthome.listing.models.dtos;

import vn.tthome.listing.models.entities.AdminUnit;

public record AdminUnitResponse(int id, Integer parentId, short level, String scheme, String name, String slug,
		Double centerLat, Double centerLng) {

	public static AdminUnitResponse from(AdminUnit unit) {
		return new AdminUnitResponse(unit.getId(), unit.getParentId(), unit.getLevel(), unit.getScheme(),
				unit.getName(), unit.getSlug(), unit.getCenterLat(), unit.getCenterLng());
	}

}
