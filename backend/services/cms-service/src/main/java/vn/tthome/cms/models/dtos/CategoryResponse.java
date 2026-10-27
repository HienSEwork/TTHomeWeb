package vn.tthome.cms.models.dtos;

import java.util.UUID;

import vn.tthome.cms.models.entities.Category;

public record CategoryResponse(UUID id, String locale, UUID parentId, String name, String slug, Short sortOrder) {

	public static CategoryResponse from(Category e) {
		return new CategoryResponse(e.getId(), e.getLocale(), e.getParentId(), e.getName(), e.getSlug(), e.getSortOrder());
	}

}
