package vn.tthome.cms.models.dtos;

import java.util.UUID;

import vn.tthome.cms.models.entities.StaticPage;

public record StaticPageResponse(UUID id, UUID translationGroupId, String locale, String slug, String title,
		String content, String status) {

	public static StaticPageResponse from(StaticPage p) {
		return new StaticPageResponse(p.getId(), p.getTranslationGroupId(), p.getLocale(), p.getSlug(), p.getTitle(),
				p.getContent(), p.getStatus());
	}

}
