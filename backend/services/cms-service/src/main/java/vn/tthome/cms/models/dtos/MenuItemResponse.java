package vn.tthome.cms.models.dtos;

import java.util.UUID;

import vn.tthome.cms.models.entities.MenuItem;

public record MenuItemResponse(UUID id, String locale, String location, UUID parentId, String label, String url, boolean external, Short sortOrder, boolean active) {

	public static MenuItemResponse from(MenuItem e) {
		return new MenuItemResponse(e.getId(), e.getLocale(), e.getLocation(), e.getParentId(), e.getLabel(), e.getUrl(), e.isExternal(), e.getSortOrder(), e.isActive());
	}

}
