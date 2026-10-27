package vn.tthome.listing.services.room;

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
import vn.tthome.listing.models.dtos.RoomAvailabilityRequest;
import vn.tthome.listing.models.dtos.RoomRequest;
import vn.tthome.listing.models.dtos.RoomResponse;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;
import vn.tthome.listing.models.entities.Amenity;
import vn.tthome.listing.models.entities.Project;
import vn.tthome.listing.models.entities.Room;
import vn.tthome.listing.repos.amenity.AmenityRepository;
import vn.tthome.listing.repos.project.ProjectRepository;
import vn.tthome.listing.repos.room.RoomRepository;
import vn.tthome.listing.services.room.impl.RoomServiceImpl;

@ExtendWith(MockitoExtension.class)
class RoomServiceImplTest {

	@Mock
	RoomRepository rooms;
	@Mock
	ProjectRepository projects;
	@Mock
	AmenityRepository amenities;

	private RoomServiceImpl service() {
		return new RoomServiceImpl(rooms, projects, amenities);
	}

	private static Project project() {
		Project project = new Project();
		project.setId(UUID.randomUUID());
		project.setName("Green House");
		return project;
	}

	private static RoomRequest request(String code, Long price) {
		return new RoomRequest(code, " Studio sunny ", "studio", (short) 3, new BigDecimal("25.5"), price, true, 1000000L,
				"full", true, false, (short) 2, null, false, null);
	}

	private static Room existing(UUID projectId, String code, Long price, String status) {
		Room room = new Room();
		room.setId(UUID.randomUUID());
		room.setProjectId(projectId);
		room.setCode(code);
		room.setTitle("T");
		room.setSlug("s");
		room.setRoomType("studio");
		room.setPrice(price == null ? null : BigDecimal.valueOf(price));
		room.setStatus(status);
		return room;
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
	void createSavesAnAvailableRoomRecordsItsPriceAndRefreshesTheProject() {
		Project project = project();
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(rooms.saveAndFlush(any(Room.class))).thenAnswer(call -> call.getArgument(0));

		RoomResponse response = service().create(project.getId(), request(" 101 ", 4_500_000L));

		ArgumentCaptor<Room> saved = ArgumentCaptor.forClass(Room.class);
		verify(rooms).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getProjectId()).isEqualTo(project.getId());
		assertThat(saved.getValue().getCode()).isEqualTo("101");
		assertThat(saved.getValue().getTitle()).isEqualTo("Studio sunny");
		assertThat(saved.getValue().getSlug()).isEqualTo("green-house-101");
		assertThat(response.status()).isEqualTo("available");
		assertThat(response.price()).isEqualTo(4_500_000L);
		assertThat(response.areaM2()).isEqualByComparingTo("25.5");
		verify(rooms).recordHistory(saved.getValue().getId(), "available", new BigDecimal(4_500_000), "admin");
		verify(projects).refreshSummary(project.getId());
	}

	@Test
	void createNumbersATakenSlug() {
		Project project = project();
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(rooms.existsBySlugAndDeletedAtIsNull("green-house-101")).thenReturn(true);
		when(rooms.saveAndFlush(any(Room.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(project.getId(), request("101", null)).slug()).isEqualTo("green-house-101-2");
	}

	@Test
	void createRefusesATakenCodeAndAnUnknownProject() {
		Project project = project();
		UUID unknown = UUID.randomUUID();
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(projects.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());
		when(rooms.existsByProjectIdAndCode(project.getId(), "101")).thenReturn(true);

		assertThatThrownBy(() -> service().create(project.getId(), request("101", 1L)))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().create(unknown, request("101", 1L)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		verify(rooms, never()).saveAndFlush(any());
		verify(projects, never()).refreshSummary(any());
	}

	@Test
	void updateRecordsAChangedPriceOnly() {
		UUID projectId = UUID.randomUUID();
		Room room = existing(projectId, "101", 4_000_000L, "available");
		when(rooms.findByIdAndDeletedAtIsNull(room.getId())).thenReturn(Optional.of(room));

		RoomResponse same = service().update(room.getId(), request("101", 4_000_000L));
		verify(rooms, never()).recordHistory(any(), any(), any(), any());
		assertThat(same.title()).isEqualTo("Studio sunny");

		service().update(room.getId(), request("101", 5_000_000L));
		verify(rooms).recordHistory(room.getId(), "available", new BigDecimal(5_000_000), "admin");
		verify(projects, org.mockito.Mockito.times(2)).refreshSummary(projectId);
	}

	@Test
	void updateRefusesTheCodeOfAnotherRoomAndUnknownRooms() {
		UUID projectId = UUID.randomUUID();
		Room room = existing(projectId, "101", 1L, "available");
		UUID unknown = UUID.randomUUID();
		when(rooms.findByIdAndDeletedAtIsNull(room.getId())).thenReturn(Optional.of(room));
		when(rooms.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());
		when(rooms.existsByProjectIdAndCodeAndIdNot(projectId, "102", room.getId())).thenReturn(true);

		assertThatThrownBy(() -> service().update(room.getId(), request("102", 1L)))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().update(unknown, request("102", 1L)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		assertThat(room.getCode()).isEqualTo("101");
		verify(rooms, never()).saveAndFlush(any());
	}

	@Test
	void availabilityChangesTheStatusThePriceOrBothAndAlwaysRecordsHistory() {
		UUID projectId = UUID.randomUUID();
		Room room = existing(projectId, "101", 4_000_000L, "available");
		when(rooms.findByIdAndDeletedAtIsNull(room.getId())).thenReturn(Optional.of(room));

		assertThat(service().setAvailability(room.getId(), new RoomAvailabilityRequest("rented", null)).status())
				.isEqualTo("rented");
		verify(rooms).recordHistory(room.getId(), "rented", new BigDecimal(4_000_000), "admin");

		assertThat(service().setAvailability(room.getId(), new RoomAvailabilityRequest(null, 4_200_000L)).price())
				.isEqualTo(4_200_000L);
		verify(rooms).recordHistory(room.getId(), "rented", new BigDecimal(4_200_000), "admin");

		RoomResponse both = service().setAvailability(room.getId(), new RoomAvailabilityRequest("available", 3_900_000L));
		assertThat(both.status()).isEqualTo("available");
		assertThat(both.price()).isEqualTo(3_900_000L);
		verify(projects, org.mockito.Mockito.times(3)).refreshSummary(projectId);
	}

	@Test
	void availabilityNeedsSomethingToChange() {
		assertThatThrownBy(() -> service().setAvailability(UUID.randomUUID(), new RoomAvailabilityRequest(null, null)))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));

		verify(rooms, never()).findByIdAndDeletedAtIsNull(any());
	}

	@Test
	void setAmenitiesAcceptsRoomAndSharedAmenitiesOnly() {
		Room room = existing(UUID.randomUUID(), "101", 1L, "available");
		when(rooms.findByIdAndDeletedAtIsNull(room.getId())).thenReturn(Optional.of(room));
		when(amenities.findAllById(Set.of((short) 1, (short) 8))).thenReturn(List.of(amenity(1, "room"), amenity(8, "both")));
		when(amenities.findAllById(Set.of((short) 4))).thenReturn(List.of(amenity(4, "project")));
		when(amenities.findAllById(Set.of((short) 77))).thenReturn(List.of());
		when(rooms.saveAndFlush(room)).thenReturn(room);

		assertThat(service().setAmenities(room.getId(), new SetAmenitiesRequest(List.of((short) 8, (short) 1))).amenityIds())
				.containsExactly((short) 1, (short) 8);
		assertThatThrownBy(() -> service().setAmenities(room.getId(), new SetAmenitiesRequest(List.of((short) 4))))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().setAmenities(room.getId(), new SetAmenitiesRequest(List.of((short) 77))))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
	}

	@Test
	void deleteHidesTheRoomFromEverythingAndRefreshesTheProject() {
		UUID projectId = UUID.randomUUID();
		Room room = existing(projectId, "101", 1L, "available");
		when(rooms.findByIdAndDeletedAtIsNull(room.getId())).thenReturn(Optional.of(room));

		service().delete(room.getId());

		assertThat(room.getDeletedAt()).isNotNull();
		verify(rooms).saveAndFlush(room);
		verify(projects).refreshSummary(projectId);
	}

	@Test
	void getAndDeleteKnowUnknownRooms() {
		UUID unknown = UUID.randomUUID();
		when(rooms.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void listChecksTheProjectAndIgnoresBlankFilters() {
		Project project = project();
		UUID unknown = UUID.randomUUID();
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(projects.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());
		when(rooms.search(any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(existing(project.getId(), "101", 1L, "available")),
						PageRequest.of(1, 5), 6));

		var page = service().list(project.getId(), " ", "", 1, 5);

		verify(rooms).search(eq(project.getId()), eq(null), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(page.total()).isEqualTo(6);
		assertThatThrownBy(() -> service().list(unknown, null, null, 0, 5))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

}
