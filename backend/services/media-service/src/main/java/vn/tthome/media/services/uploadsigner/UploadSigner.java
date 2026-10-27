package vn.tthome.media.services.uploadsigner;

import vn.tthome.media.models.dtos.UploadSignatureRequest;
import vn.tthome.media.models.dtos.UploadSignatureResponse;

/** Signs direct browser uploads to Cloudinary so that the API secret never leaves the server. */
public interface UploadSigner {

	/**
	 * @throws vn.tthome.common.error.ApiException 503 MEDIA_UNAVAILABLE while no Cloudinary account is configured.
	 */
	UploadSignatureResponse sign(UploadSignatureRequest request);

}
