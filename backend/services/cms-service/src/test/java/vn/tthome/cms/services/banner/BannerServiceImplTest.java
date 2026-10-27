package vn.tthome.cms.services.banner;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.cms.models.dtos.BannerRequest;
import vn.tthome.cms.models.dtos.BannerResponse;
import vn.tthome.cms.models.entities.Banner;
import vn.tthome.cms.repos.banner.BannerRepository;
import vn.tthome.cms.services.banner.impl.BannerServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class BannerServiceImplTest {

	@Mock
	BannerRepository repository;

	private BannerServiceImpl service() {
		return new BannerServiceImpl(repository);
	}

	private static Banner existing() {
		Banner banner = new Banner();
		banner.setId(UUID.randomUUID());
		banner.setLocale("vi");
		banner.setPlacement("old");
		banner.setImageUrl("https://res.cloudinary.com/demo/old.jpg");
		banner.setSortOrder((short) 9);
		return banner;
	}

	private static BannerRequest request(Instant starts, Instant ends) {
		return new BannerRequest("en", "home_hero", " Big sale ", "https://res.cloudinary.com/demo/a.jpg", null, "/promo",
				(short) 1, starts, ends, true);
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createSavesTheStrippedValuesUnderAGeneratedId() {
		when(repository.saveAndFlush(any(Banner.class))).thenAnswer(call -> call.getArgument(0));

		BannerResponse response = service().create(request(null, null));

		ArgumentCaptor<Banner> saved = ArgumentCaptor.forClass(Banner.class);
		verify(repository).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getId()).isNotNull();
		assertThat(response.id()).isEqualTo(saved.getValue().getId());
		assertThat(response.placement()).isEqualTo("home_hero");
		assertThat(response.title()).isEqualTo("Big sale");
		assertThat(response.locale()).isEqualTo("en");
	}

	@Test
	void updateReplacesTheFields() {
		Banner existing = existing();
		when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));
		when(repository.saveAndFlush(existing)).thenReturn(existing);

		BannerResponse response = service().update(existing.getId(), request(null, null));

		assertThat(response.id()).isEqualTo(existing.getId());
		assertThat(response.placement()).isEqualTo("home_hero");
		assertThat(response.title()).isEqualTo("Big sale");
		assertThat(response.locale()).isEqualTo("en");
	}

	@Test
	void getUpdateAndDeleteKnowUnknownIds() {
		UUID unknown = UUID.randomUUID();
		when(repository.findById(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().update(unknown, request(null, null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void deleteRemovesTheRecord() {
		Banner existing = existing();
		when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));

		service().delete(existing.getId());

		verify(repository).delete(existing);
	}

	@Test
	void theEndMustBeAfterTheStart() {
		Instant now = Instant.parse("2026-06-01T00:00:00Z");

		assertThatThrownBy(() -> service().create(request(now, now)))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().create(request(now, now.minusSeconds(1))))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void anOpenEndedBannerIsFine() {
		when(repository.saveAndFlush(any(Banner.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(request(null, null)).active()).isTrue();
		assertThat(service().create(request(Instant.parse("2026-06-01T00:00:00Z"), null)).startsAt()).isNotNull();
	}

	@Test
	void listPassesTheFiltersAndBlanksBecomeNull() {
		when(repository.search(any(), any(), any())).thenReturn(List.of(existing()));

		assertThat(service().list(" ", "home_hero", true)).hasSize(1);

		verify(repository).search(null, "home_hero", true);
	}

}
