package vn.tthome.media.models.dtos;

import java.math.BigDecimal;
import java.util.UUID;

import vn.tthome.media.models.entities.MediaAsset;

public record AssetResponse(UUID id, String publicId, String resourceType, String format, Long bytes, Integer width,
		Integer height, BigDecimal durationSec, Long version, String secureUrl, String folder, String altText,
		UUID uploadedBy) {

	public static AssetResponse from(MediaAsset a) {
		return new AssetResponse(a.getId(), a.getPublicId(), a.getResourceType(), a.getFormat(), a.getBytes(),
				a.getWidth(), a.getHeight(), a.getDurationSec(), a.getCloudVersion(), a.getSecureUrl(), a.getFolder(),
				a.getAltText(), a.getUploadedBy());
	}

}
