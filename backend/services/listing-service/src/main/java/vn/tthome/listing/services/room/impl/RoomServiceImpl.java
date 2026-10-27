package vn.tthome.listing.services.room.impl;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.HashSet;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.commons.Slugs;
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
import vn.tthome.listing.services.room.RoomService;

@Service
public class RoomServiceImpl implements RoomService {

	private static final String SOURCE = "admin";

	private final RoomRepository rooms;
	private final ProjectRepository projects;
	private final AmenityRepository amenities;

	public RoomServiceImpl(RoomRepository rooms, ProjectRepository projects, AmenityRepository amenities) {
		this.rooms = rooms;
		this.projects = projects;
		this.amenities = amenities;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<RoomResponse> list(UUID projectId, String status, String text, int page, int size) {
		findProject(projectId);
		return PageResponse.of(rooms.search(projectId, blankToNull(status), blankToNull(text), PageRequest.of(page, size)),
				RoomResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public RoomResponse get(UUID id) {
		return RoomResponse.from(find(id));
	}

	@Override
	@Transactional
	public RoomResponse create(UUID projectId, RoomRequest request) {
		Project project = findProject(projectId);
		if (rooms.existsByProjectIdAndCode(projectId, request.code().strip())) {
			throw conflict("The project already has a room with this code");
		}
		Room room = new Room();
		room.setId(UUID.randomUUID());
		room.setProjectId(projectId);
		room.setSlug(uniqueSlug(project.getName() + " " + request.code()));
		apply(room, request);
		rooms.saveAndFlush(room);
		rooms.recordHistory(room.getId(), room.getStatus(), room.getPrice(), SOURCE);
		projects.refreshSummary(projectId);
		return RoomResponse.from(room);
	}

	@Override
	@Transactional
	public RoomResponse update(UUID id, RoomRequest request) {
		Room room = find(id);
		if (rooms.existsByProjectIdAndCodeAndIdNot(room.getProjectId(), request.code().strip(), id)) {
			throw conflict("The project already has a room with this code");
		}
		BigDecimal oldPrice = room.getPrice();
		apply(room, request);
		rooms.saveAndFlush(room);
		if (!Objects.equals(oldPrice, room.getPrice())) {
			rooms.recordHistory(id, room.getStatus(), room.getPrice(), SOURCE);
		}
		projects.refreshSummary(room.getProjectId());
		return RoomResponse.from(room);
	}

	@Override
	@Transactional
	public RoomResponse setAvailability(UUID id, RoomAvailabilityRequest request) {
		if (request.status() == null && request.price() == null) {
			throw invalid("A status or a price is required");
		}
		Room room = find(id);
		if (request.status() != null) {
			room.setStatus(request.status());
		}
		if (request.price() != null) {
			room.setPrice(BigDecimal.valueOf(request.price()));
		}
		rooms.saveAndFlush(room);
		rooms.recordHistory(id, room.getStatus(), room.getPrice(), SOURCE);
		projects.refreshSummary(room.getProjectId());
		return RoomResponse.from(room);
	}

	@Override
	@Transactional
	public RoomResponse setAmenities(UUID id, SetAmenitiesRequest request) {
		Room room = find(id);
		Set<Short> wanted = new HashSet<>(request.amenityIds());
		Map<Short, Amenity> known = amenities.findAllById(wanted).stream()
				.collect(Collectors.toMap(Amenity::getId, Function.identity()));
		if (!known.keySet().containsAll(wanted)) {
			throw invalid("Unknown amenity");
		}
		if (known.values().stream().anyMatch(a -> a.getScope().equals("project"))) {
			throw invalid("A project-only amenity cannot be set on a room");
		}
		room.setAmenities(new HashSet<>(known.values()));
		return RoomResponse.from(rooms.saveAndFlush(room));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Room room = find(id);
		room.setDeletedAt(Instant.now());
		rooms.saveAndFlush(room);
		projects.refreshSummary(room.getProjectId());
	}

	private Room find(UUID id) {
		return rooms.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Room not found"));
	}

	private Project findProject(UUID id) {
		return projects.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Project not found"));
	}

	private String uniqueSlug(String text) {
		String base = Slugs.of(text);
		if (base.isEmpty()) {
			base = "room";
		}
		String slug = base;
		for (int n = 2; rooms.existsBySlugAndDeletedAtIsNull(slug); n++) {
			slug = base + "-" + n;
		}
		return slug;
	}

	private static void apply(Room room, RoomRequest r) {
		room.setCode(r.code().strip());
		room.setTitle(r.title().strip());
		room.setRoomType(r.roomType());
		room.setFloor(r.floor());
		room.setAreaM2(r.areaM2());
		room.setPrice(r.price() == null ? null : BigDecimal.valueOf(r.price()));
		room.setPriceInclUtility(Boolean.TRUE.equals(r.priceInclUtility()));
		room.setDeposit(r.deposit() == null ? null : BigDecimal.valueOf(r.deposit()));
		room.setFurniture(r.furniture());
		room.setHasBalcony(r.hasBalcony());
		room.setHasWindow(r.hasWindow());
		room.setMaxOccupants(r.maxOccupants());
		room.setAvailableFrom(r.availableFrom());
		room.setPromo(Boolean.TRUE.equals(r.promo()));
		room.setPromoNote(r.promoNote());
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
