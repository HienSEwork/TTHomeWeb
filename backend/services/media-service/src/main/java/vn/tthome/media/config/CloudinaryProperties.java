package vn.tthome.media.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** The Cloudinary account that receives the uploads; empty values mean uploads are not set up yet. */
@ConfigurationProperties("tthome.cloudinary")
public record CloudinaryProperties(String cloudName, String apiKey, String apiSecret) {

	public boolean configured() {
		return notBlank(cloudName) && notBlank(apiKey) && notBlank(apiSecret);
	}

	private static boolean notBlank(String value) {
		return value != null && !value.isBlank();
	}

}
