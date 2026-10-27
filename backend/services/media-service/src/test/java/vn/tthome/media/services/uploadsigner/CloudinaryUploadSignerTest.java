package vn.tthome.media.services.uploadsigner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.media.config.CloudinaryProperties;
import vn.tthome.media.models.dtos.UploadSignatureRequest;
import vn.tthome.media.models.dtos.UploadSignatureResponse;
import vn.tthome.media.services.uploadsigner.impl.CloudinaryUploadSigner;

class CloudinaryUploadSignerTest {

	private final Clock clock = Clock.fixed(Instant.ofEpochSecond(1_700_000_000L), ZoneOffset.UTC);

	@Test
	void signsTheFolderAndTimestampWithTheSecretAsCloudinaryExpects() {
		var signer = new CloudinaryUploadSigner(new CloudinaryProperties("demo", "key-1", "secret"), clock);

		UploadSignatureResponse response = signer.sign(new UploadSignatureRequest("tthome/projects", "image"));

		// SHA-1 of "folder=tthome/projects&timestamp=1700000000secret", computed independently with Python hashlib.
		assertThat(response.signature()).isEqualTo("92e1da10b5b46a38822cfc8c2d8319d35aaa5109");
		assertThat(response.timestamp()).isEqualTo(1_700_000_000L);
		assertThat(response.folder()).isEqualTo("tthome/projects");
		assertThat(response.cloudName()).isEqualTo("demo");
		assertThat(response.apiKey()).isEqualTo("key-1");
		assertThat(response.uploadUrl()).isEqualTo("https://api.cloudinary.com/v1_1/demo/image/upload");
	}

	@Test
	void theResourceTypeSelectsTheUploadEndpointButNotTheSignature() {
		var signer = new CloudinaryUploadSigner(new CloudinaryProperties("demo", "key-1", "secret"), clock);

		UploadSignatureResponse video = signer.sign(new UploadSignatureRequest("tthome/projects", "video"));

		assertThat(video.uploadUrl()).isEqualTo("https://api.cloudinary.com/v1_1/demo/video/upload");
		assertThat(video.signature()).isEqualTo("92e1da10b5b46a38822cfc8c2d8319d35aaa5109");
	}

	@Test
	void theSecretNeverAppearsInTheResponse() {
		var signer = new CloudinaryUploadSigner(new CloudinaryProperties("demo", "key-1", "very-secret"), clock);

		assertThat(signer.sign(new UploadSignatureRequest("a", "image")).toString()).doesNotContain("very-secret");
	}

	@Test
	void refusesToSignWhileCloudinaryIsNotConfigured() {
		for (CloudinaryProperties empty : new CloudinaryProperties[] { new CloudinaryProperties("", "", ""),
				new CloudinaryProperties(null, null, null), new CloudinaryProperties("demo", "key", " ") }) {
			assertThatThrownBy(() -> new CloudinaryUploadSigner(empty, clock).sign(new UploadSignatureRequest("a", "image")))
					.isInstanceOfSatisfying(ApiException.class, e -> {
						assertThat(e.status()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
						assertThat(e.code()).isEqualTo("MEDIA_UNAVAILABLE");
					});
		}
	}

}
