package vn.tthome.listing.services.project;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.Set;
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
import vn.tthome.listing.models.dtos.ProjectRequest;
import vn.tthome.listing.models.dtos.ProjectResponse;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;
import vn.tthome.listing.models.entities.Amenity;
import vn.tthome.listing.models.entities.Project;
import vn.tthome.listing.repos.adminunit.AdminUnitRepository;
import vn.tthome.listing.repos.amenity.AmenityRepository;
import vn.tthome.listing.repos.project.ProjectRepository;
import vn.tthome.listing.services.project.impl.ProjectServiceImpl;

@ExtendWith(MockitoExtension.class)
class ProjectServiceImplTest {

	@Mock
	ProjectRepository projects;
	@Mock
	AdminUnitRepository units;
	@Mock
	AmenityRepository amenities;

	private ProjectServiceImpl service() {
		return new ProjectServiceImpl(projects, units, amenities);
	}

	private static ProjectRequest request(String name, Integer ward, Integer wardNew, Integer district) {
		return new ProjectRequest(name, "1 Street", ward, wardNew, district, 10.5, 106.5, null, null, true, "cat", false,
				null, null, null, 3500L, null, null, null, null, "note");
	}

	private static Project existing(String name) {
		Project project = new Project();
		project.setId(UUID.randomUUID());
		project.setCode("PRJ-abc");
		project.setName(name);
		project.setSlug("old-slug");
		return project;
	}

	private static Amenity amenity(int id, String scope) {
		Amenity amenity = new Amenity();
		amenity.setId((short) id);
		amenity.setCode("a" + id);
		amenity.setName("A" + id);
		amenity.setScope(scope);
		return amenity;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createGeneratesTheCodeAndSlugAndStartsActive() {
		when(units.existsByIdAndLevelAndScheme(1, (short) 3, "pre_2025")).thenReturn(true);
		when(units.existsByIdAndLevelAndScheme(2, (short) 3, "post_2025")).thenReturn(true);
		when(units.existsByIdAndLevelAndScheme(3, (short) 2, "pre_2025")).thenReturn(true);
		when(projects.saveAndFlush(any(Project.class))).thenAnswer(call -> call.getArgument(0));

		ProjectResponse response = service().create(request(" C\u0103n h\u1ed9 Xanh ", 1, 2, 3));

		ArgumentCaptor<Project> saved = ArgumentCaptor.forClass(Project.class);
		verify(projects).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getCode()).matches("PRJ-[a-z0-9]{20}");
		assertThat(saved.getValue().getSlug()).isEqualTo("can-ho-xanh");
		assertThat(saved.getValue().getName()).isEqualTo("C\u0103n h\u1ed9 Xanh");
		assertThat(saved.getValue().getId()).isNotNull();
		assertThat(response.status()).isEqualTo("active");
		assertThat(response.petPolicy()).isEqualTo("cat");
		assertThat(response.exclusive()).isTrue();
		assertThat(response.feeElectric()).isEqualTo(3500L);
	}

	@Test
	void createAddsANumberWhenTheSlugIsTaken() {
		when(projects.existsBySlugAndDeletedAtIsNull("green")).thenReturn(true);
		when(projects.existsBySlugAndDeletedAtIsNull("green-2")).thenReturn(true);
		when(projects.saveAndFlush(any(Project.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(request("Green", null, null, null)).slug()).isEqualTo("green-3");
	}

	@Test
	void createFallsBackToAGenericSlugWhenTheNameHasNoLetters() {
		when(projects.saveAndFlush(any(Project.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(request("???", null, null, null)).slug()).isEqualTo("project");
	}

	@Test
	void createRejectsAnAreaOfTheWrongKind() {
		when(units.existsByIdAndLevelAndScheme(1, (short) 3, "pre_2025")).thenReturn(false);

		assertThatThrownBy(() -> service().create(request("X", 1, null, null)))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		verify(projects, never()).saveAndFlush(any());
	}

	@Test
	void createRejectsAnUnknownNewWardAndDistrict() {
		when(units.existsByIdAndLevelAndScheme(2, (short) 3, "post_2025")).thenReturn(false);
		when(units.existsByIdAndLevelAndScheme(3, (short) 2, "pre_2025")).thenReturn(false);

		assertThatThrownBy(() -> service().create(request("X", null, 2, null)))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().create(request("X", null, null, 3)))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
	}

	@Test
	void updateKeepsTheSlugWhileTheNameIsUnchangedAndRenewsItWhenItChanges() {
		Project project = existing("Old name");
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(projects.saveAndFlush(project)).thenReturn(project);

		assertThat(service().update(project.getId(), request(" Old name ", null, null, null)).slug())
				.isEqualTo("old-slug");
		assertThat(service().update(project.getId(), request("New name", null, null, null)).slug())
				.isEqualTo("new-name");
	}

	@Test
	void updateAndStatusKnowUnknownProjects() {
		UUID id = UUID.randomUUID();
		when(projects.findByIdAndDeletedAtIsNull(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().update(id, request("X", null, null, null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setStatus(id, "hidden"))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().get(id)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(id))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void setStatusChangesOnlyTheStatus() {
		Project project = existing("P");
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(projects.saveAndFlush(project)).thenReturn(project);

		assertThat(service().setStatus(project.getId(), "hidden").status()).isEqualTo("hidden");
	}

	@Test
	void setAmenitiesReplacesTheSetWithProjectAndSharedAmenities() {
		Project project = existing("P");
		project.getAmenities().add(amenity(9, "project"));
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(amenities.findAllById(Set.of((short) 4, (short) 8)))
				.thenReturn(List.of(amenity(4, "project"), amenity(8, "both")));
		when(projects.saveAndFlush(project)).thenReturn(project);

		ProjectResponse response = service().setAmenities(project.getId(), new SetAmenitiesRequest(List.of((short) 8, (short) 4, (short) 8)));

		assertThat(response.amenityIds()).containsExactly((short) 4, (short) 8);
	}

	@Test
	void setAmenitiesRejectsUnknownAndRoomOnlyAmenities() {
		Project project = existing("P");
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(amenities.findAllById(Set.of((short) 1, (short) 77))).thenReturn(List.of(amenity(1, "room")));
		when(amenities.findAllById(Set.of((short) 1))).thenReturn(List.of(amenity(1, "room")));

		assertThatThrownBy(() -> service().setAmenities(project.getId(), new SetAmenitiesRequest(List.of((short) 1, (short) 77))))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().setAmenities(project.getId(), new SetAmenitiesRequest(List.of((short) 1))))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		verify(projects, never()).saveAndFlush(any());
	}

	@Test
	void deleteMarksTheProjectDeletedWhenItHasNoRooms() {
		Project project = existing("P");
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));

		service().delete(project.getId());

		assertThat(project.getDeletedAt()).isNotNull();
		verify(projects).saveAndFlush(project);
	}

	@Test
	void deleteRefusesAProjectThatStillHasRooms() {
		Project project = existing("P");
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(projects.hasRooms(project.getId())).thenReturn(true);

		assertThatThrownBy(() -> service().delete(project.getId()))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));

		assertThat(project.getDeletedAt()).isNull();
		verify(projects, never()).saveAndFlush(any());
	}

	@Test
	void listIgnoresBlankFilters() {
		when(projects.search(any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(existing("P")), PageRequest.of(1, 5), 6));

		var page = service().list(" ", "", 7, null, 1, 5);

		verify(projects).search(eq(null), eq(null), eq(7), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(page.total()).isEqualTo(6);
	}

}
