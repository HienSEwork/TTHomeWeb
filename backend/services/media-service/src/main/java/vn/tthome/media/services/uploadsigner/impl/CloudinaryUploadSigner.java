package vn.tthome.media.services.uploadsigner.impl;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Clock;
import java.util.HexFormat;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.media.config.CloudinaryProperties;
import vn.tthome.media.models.dtos.UploadSignatureRequest;
import vn.tthome.media.models.dtos.UploadSignatureResponse;
import vn.tthome.media.services.uploadsigner.UploadSigner;

@Service
public class CloudinaryUploadSigner implements UploadSigner {

	private final CloudinaryProperties cloudinary;
	private final Clock clock;

	public CloudinaryUploadSigner(CloudinaryProperties cloudinary, Clock clock) {
		this.cloudinary = cloudinary;
		this.clock = clock;
	}

	@Override
	public UploadSignatureResponse sign(UploadSignatureRequest request) {
		if (!cloudinary.configured()) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MEDIA_UNAVAILABLE", "Uploads are not set up");
		}
		long timestamp = clock.instant().getEpochSecond();
		// Cloudinary signs the sorted key=value pairs joined by "&" with the API secret appended, using SHA-1.
		String toSign = "folder=" + request.folder() + "&timestamp=" + timestamp;
		return new UploadSignatureResponse(
				"https://api.cloudinary.com/v1_1/" + cloudinary.cloudName() + "/" + request.resourceType() + "/upload",
				cloudinary.cloudName(), cloudinary.apiKey(), timestamp, request.folder(),
				sha1Hex(toSign + cloudinary.apiSecret()));
	}

	private static String sha1Hex(String text) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-1").digest(text.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException(e);
		}
	}

}
