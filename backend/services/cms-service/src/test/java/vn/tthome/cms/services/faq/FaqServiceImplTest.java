package vn.tthome.cms.services.faq;

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

import vn.tthome.cms.models.dtos.FaqRequest;
import vn.tthome.cms.models.dtos.FaqResponse;
import vn.tthome.cms.models.entities.Faq;
import vn.tthome.cms.repos.faq.FaqRepository;
import vn.tthome.cms.services.faq.impl.FaqServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class FaqServiceImplTest {

	@Mock
	FaqRepository repository;

	private FaqServiceImpl service() {
		return new FaqServiceImpl(repository);
	}

	private static Faq existing() {
		Faq faq = new Faq();
		faq.setId(UUID.randomUUID());
		faq.setLocale("vi");
		faq.setAudience("all");
		faq.setQuestion("old?");
		faq.setAnswer("old");
		faq.setSortOrder((short) 9);
		return faq;
	}

	private static FaqRequest request() {
		return new FaqRequest("vi", "tenant", " How to book? ", " Press the button ", (short) 1, true);
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createSavesTheStrippedValuesUnderAGeneratedId() {
		when(repository.saveAndFlush(any(Faq.class))).thenAnswer(call -> call.getArgument(0));

		FaqResponse response = service().create(request());

		ArgumentCaptor<Faq> saved = ArgumentCaptor.forClass(Faq.class);
		verify(repository).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getId()).isNotNull();
		assertThat(response.id()).isEqualTo(saved.getValue().getId());
		assertThat(response.question()).isEqualTo("How to book?");
		assertThat(response.answer()).isEqualTo("Press the button");
		assertThat(response.audience()).isEqualTo("tenant");
	}

	@Test
	void updateReplacesTheFields() {
		Faq existing = existing();
		when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));
		when(repository.saveAndFlush(existing)).thenReturn(existing);

		FaqResponse response = service().update(existing.getId(), request());

		assertThat(response.id()).isEqualTo(existing.getId());
		assertThat(response.question()).isEqualTo("How to book?");
		assertThat(response.answer()).isEqualTo("Press the button");
		assertThat(response.audience()).isEqualTo("tenant");
	}

	@Test
	void getUpdateAndDeleteKnowUnknownIds() {
		UUID unknown = UUID.randomUUID();
		when(repository.findById(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().update(unknown, request()))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void deleteRemovesTheRecord() {
		Faq existing = existing();
		when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));

		service().delete(existing.getId());

		verify(repository).delete(existing);
	}

	@Test
	void aMissingActiveFlagMeansActive() {
		when(repository.saveAndFlush(any(Faq.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(new FaqRequest("vi", "all", "Q?", "A", (short) 1, null)).active()).isTrue();
		assertThat(service().create(new FaqRequest("vi", "all", "Q?", "A", (short) 1, false)).active()).isFalse();
	}

	@Test
	void listPassesTheFiltersAndBlanksBecomeNull() {
		when(repository.search(any(), any(), any())).thenReturn(List.of(existing()));

		assertThat(service().list("", " tenant ", null)).hasSize(1);

		verify(repository).search(null, "tenant", null);
	}

}
