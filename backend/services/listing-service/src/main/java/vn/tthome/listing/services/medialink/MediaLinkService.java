package vn.tthome.listing.services.medialink;

import java.util.List;
import java.util.UUID;

import vn.tthome.listing.models.dtos.MediaLinkResponse;
import vn.tthome.listing.models.dtos.SetMediaRequest;

/** The photos, videos, floor plans and 360 views of projects and rooms. */
public interface MediaLinkService {

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted project. */
	List<MediaLinkResponse> ofProject(UUID projectId);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted room. */
	List<MediaLinkResponse> ofRoom(UUID roomId);

	/**
	 * Replaces the gallery of a project. The cover photo becomes the project cover and the first video its video.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR for a repeated asset, more than
	 *         one cover, or a cover that is not a photo.
	 */
	List<MediaLinkResponse> replaceForProject(UUID projectId, SetMediaRequest request);

	/**
	 * Replaces the gallery of a room; the cover photo becomes the room cover.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR as for a project.
	 */
	List<MediaLinkResponse> replaceForRoom(UUID roomId, SetMediaRequest request);

}
