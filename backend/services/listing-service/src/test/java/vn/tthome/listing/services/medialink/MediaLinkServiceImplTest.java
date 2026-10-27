package vn.tthome.listing.services.medialink;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.inOrder;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.listing.models.dtos.MediaLinkItem;
import vn.tthome.listing.models.dtos.MediaLinkResponse;
import vn.tthome.listing.models.dtos.SetMediaRequest;
import vn.tthome.listing.models.entities.MediaLink;
import vn.tthome.listing.models.entities.Project;
import vn.tthome.listing.models.entities.Room;
import vn.tthome.listing.repos.medialink.MediaLinkRepository;
import vn.tthome.listing.repos.project.ProjectRepository;
import vn.tthome.listing.repos.room.RoomRepository;
import vn.tthome.listing.services.medialink.impl.MediaLinkServiceImpl;

@ExtendWith(MockitoExtension.class)
class MediaLinkServiceImplTest {

	@Mock
	MediaLinkRepository links;
	@Mock
	ProjectRepository projects;
	@Mock
	RoomRepository rooms;

	private MediaLinkServiceImpl service() {
		return new MediaLinkServiceImpl(links, projects, rooms);
	}

	private static MediaLinkItem item(UUID asset, String kind, Boolean cover) {
		return new MediaLinkItem(asset, kind, cover);
	}

	private static Project project() {
		Project project = new Project();
		project.setId(UUID.randomUUID());
		return project;
	}

	private static Room room() {
		Room room = new Room();
		room.setId(UUID.randomUUID());
		return room;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@SuppressWarnings("unchecked")
	private ArgumentCaptor<List<MediaLink>> savedRows() {
		return ArgumentCaptor.forClass(List.class);
	}

	@Test
	void replacingAProjectGalleryClearsThenWritesInOrderAndSetsCoverAndVideo() {
		Project project = project();
		UUID photo = UUID.randomUUID();
		UUID plan = UUID.randomUUID();
		UUID clip = UUID.randomUUID();
		UUID secondClip = UUID.randomUUID();
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(links.saveAllAndFlush(any())).thenAnswer(call -> call.getArgument(0));

		List<MediaLinkResponse> result = service().replaceForProject(project.getId(), new SetMediaRequest(
				List.of(item(plan, "floorplan", null), item(photo, "photo", true), item(clip, "video", false),
						item(secondClip, "video", null))));

		InOrder order = inOrder(links);
		order.verify(links).deleteAllOf("project", project.getId());
		ArgumentCaptor<List<MediaLink>> rows = savedRows();
		order.verify(links).saveAllAndFlush(rows.capture());
		assertThat(rows.getValue()).extracting(MediaLink::getAssetId).containsExactly(plan, photo, clip, secondClip);
		assertThat(rows.getValue()).extracting(MediaLink::getSortOrder).containsExactly((short) 0, (short) 1, (short) 2,
				(short) 3);
		assertThat(rows.getValue()).extracting(MediaLink::isCover).containsExactly(false, true, false, false);
		assertThat(rows.getValue()).allMatch(l -> l.getOwnerType().equals("project") && l.getOwnerId().equals(project.getId()));
		assertThat(project.getCoverAssetId()).isEqualTo(photo);
		assertThat(project.getVideoAssetId()).isEqualTo(clip);
		verify(projects).saveAndFlush(project);
		assertThat(result).extracting(MediaLinkResponse::assetId).containsExactly(plan, photo, clip, secondClip);
	}

	@Test
	void replacingARoomGalleryWithNothingClearsTheCover() {
		Room room = room();
		room.setCoverAssetId(UUID.randomUUID());
		when(rooms.findByIdAndDeletedAtIsNull(room.getId())).thenReturn(Optional.of(room));
		when(links.saveAllAndFlush(any())).thenAnswer(call -> call.getArgument(0));

		assertThat(service().replaceForRoom(room.getId(), new SetMediaRequest(List.of()))).isEmpty();

		verify(links).deleteAllOf("room", room.getId());
		assertThat(room.getCoverAssetId()).isNull();
		verify(rooms).saveAndFlush(room);
	}

	@Test
	void aGalleryWithoutVideoClearsTheProjectVideo() {
		Project project = project();
		project.setVideoAssetId(UUID.randomUUID());
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(links.saveAllAndFlush(any())).thenAnswer(call -> call.getArgument(0));

		service().replaceForProject(project.getId(), new SetMediaRequest(List.of(item(UUID.randomUUID(), "photo", null))));

		assertThat(project.getVideoAssetId()).isNull();
		assertThat(project.getCoverAssetId()).isNull();
	}

	@Test
	void invalidGalleriesAreRefusedBeforeAnythingChanges() {
		Room room = room();
		UUID asset = UUID.randomUUID();
		when(rooms.findByIdAndDeletedAtIsNull(room.getId())).thenReturn(Optional.of(room));

		for (SetMediaRequest bad : List.of(
				new SetMediaRequest(List.of(item(asset, "photo", null), item(asset, "video", null))), // repeated asset
				new SetMediaRequest(List.of(item(asset, "photo", true), item(UUID.randomUUID(), "photo", true))),
				new SetMediaRequest(List.of(item(asset, "video", true))))) { // a video cannot be the cover
			assertThatThrownBy(() -> service().replaceForRoom(room.getId(), bad))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		verify(links, never()).deleteAllOf(any(), any());
		verify(links, never()).saveAllAndFlush(any());
		verify(rooms, never()).saveAndFlush(any());
	}

	@Test
	void unknownOwnersAreNotFound() {
		UUID unknown = UUID.randomUUID();
		when(projects.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());
		when(rooms.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().ofProject(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().ofRoom(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().replaceForProject(unknown, new SetMediaRequest(List.of())))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().replaceForRoom(unknown, new SetMediaRequest(List.of())))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		verify(links, never()).deleteAllOf(any(), any());
	}

	@Test
	void readingReturnsTheLinksInOrder() {
		Project project = project();
		MediaLink link = new MediaLink();
		link.setAssetId(UUID.randomUUID());
		link.setKind("photo");
		link.setSortOrder((short) 0);
		link.setCover(true);
		when(projects.findByIdAndDeletedAtIsNull(project.getId())).thenReturn(Optional.of(project));
		when(links.findByOwnerTypeAndOwnerIdOrderBySortOrderAsc("project", project.getId())).thenReturn(List.of(link));

		assertThat(service().ofProject(project.getId())).containsExactly(new MediaLinkResponse(link.getAssetId(), "photo",
				(short) 0, true));
	}

}
