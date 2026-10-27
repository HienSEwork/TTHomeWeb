package vn.tthome.media.services.asset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.media.config.CloudinaryProperties;
import vn.tthome.media.models.dtos.AssetRequest;
import vn.tthome.media.models.dtos.AssetResponse;
import vn.tthome.media.models.entities.MediaAsset;
import vn.tthome.media.repos.asset.MediaAssetRepository;
import vn.tthome.media.services.asset.impl.AssetServiceImpl;

@ExtendWith(MockitoExtension.class)
class AssetServiceImplTest {

	private static final CloudinaryProperties CLOUD = new CloudinaryProperties("demo", "key", "secret");

	@Mock
	MediaAssetRepository assets;

	private AssetServiceImpl service() {
		return new AssetServiceImpl(assets, CLOUD);
	}

	private static AssetRequest request(String url) {
		return new AssetRequest("tthome/projects/abc", "image", "jpg", 12345L, 800, 600, null, 1700000000L, url,
				"tthome/projects", "Front view");
	}

	private static MediaAsset asset() {
		MediaAsset asset = new MediaAsset();
		asset.setId(UUID.randomUUID());
		asset.setPublicId("p");
		asset.setResourceType("image");
		asset.setSecureUrl("https://res.cloudinary.com/demo/image/upload/p.jpg");
		return asset;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void registerStoresTheMetadataAndWhoUploadedIt() {
		UUID admin = UUID.randomUUID();
		when(assets.saveAndFlush(any(MediaAsset.class))).thenAnswer(call -> call.getArgument(0));

		AssetResponse response = service().register(admin,
				request("https://res.cloudinary.com/demo/image/upload/v1700000000/tthome/projects/abc.jpg"));

		ArgumentCaptor<MediaAsset> saved = ArgumentCaptor.forClass(MediaAsset.class);
		verify(assets).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getId()).isNotNull();
		assertThat(saved.getValue().getUploadedBy()).isEqualTo(admin);
		assertThat(saved.getValue().getCloudVersion()).isEqualTo(1700000000L);
		assertThat(response.publicId()).isEqualTo("tthome/projects/abc");
		assertThat(response.width()).isEqualTo(800);
		assertThat(response.durationSec()).isNull();
		assertThat(response.uploadedBy()).isEqualTo(admin);
	}

	@Test
	void registerKeepsTheDurationOfAVideo() {
		when(assets.saveAndFlush(any(MediaAsset.class))).thenAnswer(call -> call.getArgument(0));
		AssetRequest video = new AssetRequest("v", "video", "mp4", 1L, 1920, 1080, new BigDecimal("12.34"), 1L,
				"https://res.cloudinary.com/demo/video/upload/v.mp4", null, null);

		assertThat(service().register(UUID.randomUUID(), video).durationSec()).isEqualByComparingTo("12.34");
	}

	@Test
	void registerRefusesUrlsOfAnotherAccountOrHost() {
		for (String url : List.of("https://res.cloudinary.com/other/image/upload/x.jpg",
				"https://res.cloudinary.com/demo-evil/image/upload/x.jpg", "http://res.cloudinary.com/demo/image/upload/x.jpg",
				"https://evil.example/res.cloudinary.com/demo/x.jpg", "https://res.cloudinary.com/demo")) {
			assertThatThrownBy(() -> service().register(UUID.randomUUID(), request(url)))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		verify(assets, never()).saveAndFlush(any());
	}

	@Test
	void registerRefusesADuplicatePublicId() {
		when(assets.existsByPublicId("tthome/projects/abc")).thenReturn(true);

		assertThatThrownBy(() -> service().register(UUID.randomUUID(),
				request("https://res.cloudinary.com/demo/image/upload/x.jpg")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
	}

	@Test
	void registerNeedsAConfiguredAccount() {
		var unconfigured = new AssetServiceImpl(assets, new CloudinaryProperties("", "", ""));

		assertThatThrownBy(() -> unconfigured.register(UUID.randomUUID(), request("https://res.cloudinary.com/demo/x")))
				.satisfies(e -> assertApi(e, HttpStatus.SERVICE_UNAVAILABLE, "MEDIA_UNAVAILABLE"));
	}

	@Test
	void deleteMarksTheAssetDeletedAndUnknownOnesAreNotFound() {
		MediaAsset asset = asset();
		UUID unknown = UUID.randomUUID();
		when(assets.findByIdAndDeletedAtIsNull(asset.getId())).thenReturn(Optional.of(asset));
		when(assets.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());

		service().delete(asset.getId());

		assertThat(asset.getDeletedAt()).isNotNull();
		verify(assets).saveAndFlush(asset);
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void listIgnoresBlankFilters() {
		when(assets.search(any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(asset()), PageRequest.of(1, 5), 6));

		var page = service().list(" ", "", "  ", 1, 5);

		verify(assets).search(eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(page.total()).isEqualTo(6);
	}

}
