package vn.tthome.listing.services.amenity;

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
import vn.tthome.listing.models.dtos.AmenityRequest;
import vn.tthome.listing.models.dtos.AmenityResponse;
import vn.tthome.listing.models.entities.Amenity;
import vn.tthome.listing.repos.amenity.AmenityRepository;
import vn.tthome.listing.services.amenity.impl.AmenityServiceImpl;

@ExtendWith(MockitoExtension.class)
class AmenityServiceImplTest {

	@Mock
	AmenityRepository repository;

	private AmenityServiceImpl service() {
		return new AmenityServiceImpl(repository);
	}

	private static AmenityRequest request(String code) {
		return new AmenityRequest(code, " Display name ", "room", "icon", (short) 5, true);
	}

	private static Amenity existing(int id, String code) {
		Amenity entity = new Amenity();
		entity.setId((short) id);
		entity.setCode(code);
		entity.setName("Name");
		entity.setScope("room");
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
		when(repository.saveAndFlush(any(Amenity.class))).thenAnswer(call -> call.getArgument(0));

		AmenityResponse response = service().create(request("new_code"));

		ArgumentCaptor<Amenity> saved = ArgumentCaptor.forClass(Amenity.class);
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
		Amenity entity = existing(3, "old_code");
		when(repository.findById((short) 3)).thenReturn(Optional.of(entity));
		when(repository.saveAndFlush(entity)).thenReturn(entity);

		AmenityResponse response = service().update((short) 3, request("renamed"));

		assertThat(response.id()).isEqualTo((short) 3);
		assertThat(response.code()).isEqualTo("renamed");
		assertThat(response.name()).isEqualTo("Display name");
	}

	@Test
	void updateKeepsItsOwnCodeButRefusesAnotherOnesAndUnknownIds() {
		Amenity entity = existing(3, "old_code");
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
		Amenity entity = existing(3, "old_code");
		when(repository.findById((short) 3)).thenReturn(Optional.of(entity));

		service().delete((short) 3);

		verify(repository).delete(entity);
	}

	@Test
	void deleteRefusesAnAmenityThatIsInUse() {
		Amenity entity = existing(3, "old_code");
		when(repository.findById((short) 3)).thenReturn(Optional.of(entity));
		when(repository.isUsed((short) 3)).thenReturn(true);

		assertThatThrownBy(() -> service().delete((short) 3))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));

		verify(repository, never()).delete(entity);
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

		assertThat(service().list()).extracting(AmenityResponse::code).containsExactly("b_code", "a_code");
	}

}
