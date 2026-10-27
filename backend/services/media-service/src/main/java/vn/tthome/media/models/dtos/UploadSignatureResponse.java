package vn.tthome.media.models.dtos;

/** Everything the browser needs to upload straight to Cloudinary; the secret is never part of it. */
public record UploadSignatureResponse(String uploadUrl, String cloudName, String apiKey, long timestamp, String folder,
		String signature) {
}
