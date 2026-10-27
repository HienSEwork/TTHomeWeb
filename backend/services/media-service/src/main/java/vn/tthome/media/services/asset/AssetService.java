package vn.tthome.media.services.asset;

import java.util.UUID;

import vn.tthome.common.web.PageResponse;
import vn.tthome.media.models.dtos.AssetRequest;
import vn.tthome.media.models.dtos.AssetResponse;

/** The register of files uploaded to Cloudinary. */
public interface AssetService {

	/** One page of assets, newest first; blank filters are ignored. */
	PageResponse<AssetResponse> list(String folder, String resourceType, String text, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted asset. */
	AssetResponse get(UUID id);

	/**
	 * Registers an uploaded file. The URL must be a Cloudinary delivery URL of the configured account.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for a URL that is not ours, 409 CONFLICT for a
	 *         public id that is already registered, 503 MEDIA_UNAVAILABLE while no Cloudinary account is configured.
	 */
	AssetResponse register(UUID uploadedBy, AssetRequest request);

	/**
	 * Removes the asset from the register. The file stays on Cloudinary.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted asset.
	 */
	void delete(UUID id);

}
