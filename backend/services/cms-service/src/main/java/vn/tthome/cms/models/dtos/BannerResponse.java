package vn.tthome.cms.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.cms.models.entities.Banner;

public record BannerResponse(UUID id, String locale, String placement, String title, String imageUrl, String mobileImageUrl, String linkUrl, Short sortOrder, Instant startsAt, Instant endsAt, boolean active) {

	public static BannerResponse from(Banner e) {
		return new BannerResponse(e.getId(), e.getLocale(), e.getPlacement(), e.getTitle(), e.getImageUrl(), e.getMobileImageUrl(), e.getLinkUrl(), e.getSortOrder(), e.getStartsAt(), e.getEndsAt(), e.isActive());
	}

}
