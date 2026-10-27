package vn.tthome.listing.models.dtos;

import java.util.UUID;

import vn.tthome.listing.models.entities.MediaLink;

public record MediaLinkResponse(UUID assetId, String kind, short sortOrder, boolean cover) {

	public static MediaLinkResponse from(MediaLink link) {
		return new MediaLinkResponse(link.getAssetId(), link.getKind(), link.getSortOrder(), link.isCover());
	}

}
