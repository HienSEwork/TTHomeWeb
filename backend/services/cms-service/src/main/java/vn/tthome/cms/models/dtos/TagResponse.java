package vn.tthome.cms.models.dtos;

import java.util.UUID;

import vn.tthome.cms.models.entities.Tag;

public record TagResponse(UUID id, String locale, String name, String slug) {

	public static TagResponse from(Tag e) {
		return new TagResponse(e.getId(), e.getLocale(), e.getName(), e.getSlug());
	}

}
