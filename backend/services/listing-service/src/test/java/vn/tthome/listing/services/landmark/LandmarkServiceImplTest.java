package vn.tthome.listing.services.landmark;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.listing.models.dtos.LandmarkRequest;
import vn.tthome.listing.models.dtos.LandmarkResponse;
import vn.tthome.listing.models.entities.Landmark;
import vn.tthome.listing.repos.landmark.LandmarkRepository;
import vn.tthome.listing.services.landmark.impl.LandmarkServiceImpl;

@ExtendWith(MockitoExtension.class)
class LandmarkServiceImplTest {

	@Mock
	LandmarkRepository repository;

	private LandmarkServiceImpl service() {
		return new LandmarkServiceImpl(repository);
	}

	private static LandmarkRequest request(String code) {
		return new LandmarkRequest(code, " Display name ", "mall", 10.5, 106.5, 3000, (short) 5);
	}

	private static Landmark existing(int id, String code) {
		Landmark entity = new Landmark();
		entity.setId((short) id);
		entity.setCode(code);
		entity.setName("Name");
		entity.setKind("mall");
		return entity;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createUsesTheNextFreeIdAndStripsTheName() {
		when(repository.nextId()).thenReturn((short) 14);
		when(repository.saveAndFlush(any(Landmark.class))).thenAnswer(call -> call.getArgument(0));

		LandmarkResponse response = service().create(request("new_code"));

		ArgumentCaptor<Landmark> saved = ArgumentCaptor.forClass(Landmark.class);
		verify(repository).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getId()).isEqualTo((short) 14);
		assertThat(saved.getValue().getName()).isEqualTo("Display name");
		assertThat(response.id()).isEqualTo((short) 14);
		assertThat(response.code()).isEqualTo("new_code");
	}

	@Test
	void createRefusesATakenCode() {
		when(repository.existsByCode("taken")).thenReturn(true);

		assertThatThrownBy(() -> service().create(request("taken")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));

		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void updateReplacesTheEditableFields() {
		Landmark entity = existing(3, "old_code");
		when(repository.findById((short) 3)).thenReturn(Optional.of(entity));
		when(repository.saveAndFlush(entity)).thenReturn(entity);

		LandmarkResponse response = service().update((short) 3, request("renamed"));

		assertThat(response.id()).isEqualTo((short) 3);
		assertThat(response.code()).isEqualTo("renamed");
		assertThat(response.name()).isEqualTo("Display name");
	}

	@Test
	void updateKeepsItsOwnCodeButRefusesAnotherOnesAndUnknownIds() {
		Landmark entity = existing(3, "old_code");
		when(repository.findById((short) 3)).thenReturn(Optional.of(entity));
		when(repository.findById((short) 9)).thenReturn(Optional.empty());
		when(repository.existsByCodeAndIdNot("old_code", (short) 3)).thenReturn(false);
		when(repository.existsByCodeAndIdNot("taken", (short) 3)).thenReturn(true);
		when(repository.saveAndFlush(entity)).thenReturn(entity);

		service().update((short) 3, request("old_code"));
		assertThatThrownBy(() -> service().update((short) 3, request("taken")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().update((short) 9, request("any_code")))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void deleteRemovesTheRecord() {
		Landmark entity = existing(3, "old_code");
		when(repository.findById((short) 3)).thenReturn(Optional.of(entity));

		service().delete((short) 3);

		verify(repository).delete(entity);
	}
	@Test
	void getAndDeleteKnowUnknownIds() {
		when(repository.findById((short) 9)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().get((short) 9)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete((short) 9))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void listIsInDisplayOrder() {
		when(repository.findAll(Sort.by("sortOrder", "id"))).thenReturn(List.of(existing(2, "b_code"), existing(1, "a_code")));

		assertThat(service().list()).extracting(LandmarkResponse::code).containsExactly("b_code", "a_code");
	}

}
