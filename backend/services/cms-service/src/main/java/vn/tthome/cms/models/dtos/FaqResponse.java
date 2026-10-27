package vn.tthome.cms.models.dtos;

import java.util.UUID;

import vn.tthome.cms.models.entities.Faq;

public record FaqResponse(UUID id, String locale, String audience, String question, String answer, Short sortOrder, boolean active) {

	public static FaqResponse from(Faq e) {
		return new FaqResponse(e.getId(), e.getLocale(), e.getAudience(), e.getQuestion(), e.getAnswer(), e.getSortOrder(), e.isActive());
	}

}
