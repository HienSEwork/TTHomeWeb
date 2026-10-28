package vn.tthome.search.models.dtos;

import java.util.UUID;

/** Lightweight pin for the map: only what is needed to draw the marker and its popup card. */
public record MapPinResponse(
		UUID roomId,
		double lat,
		double lng,
		Long price,
		String priceLabel,
		String title,
		String projectName,
		String roomSlug,
		String thumbnailUrl,
		String roomType,
		Boolean hasBalcony,
		String petPolicy) {

}
