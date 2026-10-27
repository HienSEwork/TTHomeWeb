package vn.tthome.listing.services.medialink.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.IntStream;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
import vn.tthome.listing.services.medialink.MediaLinkService;

@Service
public class MediaLinkServiceImpl implements MediaLinkService {

	private static final String PROJECT = "project";
	private static final String ROOM = "room";

	private final MediaLinkRepository links;
	private final ProjectRepository projects;
	private final RoomRepository rooms;

	public MediaLinkServiceImpl(MediaLinkRepository links, ProjectRepository projects, RoomRepository rooms) {
		this.links = links;
		this.projects = projects;
		this.rooms = rooms;
	}

	@Override
	@Transactional(readOnly = true)
	public List<MediaLinkResponse> ofProject(UUID projectId) {
		findProject(projectId);
		return read(PROJECT, projectId);
	}

	@Override
	@Transactional(readOnly = true)
	public List<MediaLinkResponse> ofRoom(UUID roomId) {
		findRoom(roomId);
		return read(ROOM, roomId);
	}

	@Override
	@Transactional
	public List<MediaLinkResponse> replaceForProject(UUID projectId, SetMediaRequest request) {
		Project project = findProject(projectId);
		validate(request);
		List<MediaLinkResponse> result = write(PROJECT, projectId, request);
		project.setCoverAssetId(cover(request));
		project.setVideoAssetId(request.items().stream().filter(i -> i.kind().equals("video")).map(MediaLinkItem::assetId)
				.findFirst().orElse(null));
		projects.saveAndFlush(project);
		return result;
	}

	@Override
	@Transactional
	public List<MediaLinkResponse> replaceForRoom(UUID roomId, SetMediaRequest request) {
		Room room = findRoom(roomId);
		validate(request);
		List<MediaLinkResponse> result = write(ROOM, roomId, request);
		room.setCoverAssetId(cover(request));
		rooms.saveAndFlush(room);
		return result;
	}

	private List<MediaLinkResponse> read(String ownerType, UUID ownerId) {
		return links.findByOwnerTypeAndOwnerIdOrderBySortOrderAsc(ownerType, ownerId).stream()
				.map(MediaLinkResponse::from).toList();
	}

	private List<MediaLinkResponse> write(String ownerType, UUID ownerId, SetMediaRequest request) {
		links.deleteAllOf(ownerType, ownerId);
		List<MediaLinkItem> items = request.items();
		List<MediaLink> rows = IntStream.range(0, items.size()).mapToObj(i -> {
			MediaLink link = new MediaLink();
			link.setId(UUID.randomUUID());
			link.setOwnerType(ownerType);
			link.setOwnerId(ownerId);
			link.setAssetId(items.get(i).assetId());
			link.setKind(items.get(i).kind());
			link.setSortOrder((short) i);
			link.setCover(Boolean.TRUE.equals(items.get(i).cover()));
			return link;
		}).toList();
		return links.saveAllAndFlush(rows).stream().map(MediaLinkResponse::from).toList();
	}

	private static UUID cover(SetMediaRequest request) {
		return request.items().stream().filter(i -> Boolean.TRUE.equals(i.cover())).map(MediaLinkItem::assetId).findFirst()
				.orElse(null);
	}

	private static void validate(SetMediaRequest request) {
		Set<UUID> seen = new HashSet<>();
		int covers = 0;
		for (MediaLinkItem item : request.items()) {
			if (!seen.add(item.assetId())) {
				throw invalid("An asset can appear only once");
			}
			if (Boolean.TRUE.equals(item.cover())) {
				covers++;
				if (!item.kind().equals("photo")) {
					throw invalid("The cover must be a photo");
				}
			}
		}
		if (covers > 1) {
			throw invalid("There can be only one cover");
		}
	}

	private Project findProject(UUID id) {
		return projects.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Project not found"));
	}

	private Room findRoom(UUID id) {
		return rooms.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Room not found"));
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

}
