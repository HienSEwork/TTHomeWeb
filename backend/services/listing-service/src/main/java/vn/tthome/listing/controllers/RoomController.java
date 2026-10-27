package vn.tthome.listing.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.RoomAvailabilityRequest;
import vn.tthome.listing.models.dtos.RoomRequest;
import vn.tthome.listing.models.dtos.RoomResponse;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;
import vn.tthome.listing.services.room.RoomService;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class RoomController {

	private final RoomService rooms;

	public RoomController(RoomService rooms) {
		this.rooms = rooms;
	}

	@GetMapping("/projects/{projectId}/rooms")
	public PageResponse<RoomResponse> list(@PathVariable UUID projectId,
			@RequestParam(required = false) @Size(max = 16) String status,
			@RequestParam(required = false) @Size(max = 100) String q,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "50") @Min(1) @Max(200) int size) {
		return rooms.list(projectId, status, q, page, size);
	}

	@PostMapping("/projects/{projectId}/rooms")
	@ResponseStatus(HttpStatus.CREATED)
	public RoomResponse create(@PathVariable UUID projectId, @Valid @RequestBody RoomRequest body) {
		return rooms.create(projectId, body);
	}

	@GetMapping("/rooms/{id}")
	public RoomResponse get(@PathVariable UUID id) {
		return rooms.get(id);
	}

	@PutMapping("/rooms/{id}")
	public RoomResponse update(@PathVariable UUID id, @Valid @RequestBody RoomRequest body) {
		return rooms.update(id, body);
	}

	@PutMapping("/rooms/{id}/availability")
	public RoomResponse setAvailability(@PathVariable UUID id, @Valid @RequestBody RoomAvailabilityRequest body) {
		return rooms.setAvailability(id, body);
	}

	@PutMapping("/rooms/{id}/amenities")
	public RoomResponse setAmenities(@PathVariable UUID id, @Valid @RequestBody SetAmenitiesRequest body) {
		return rooms.setAmenities(id, body);
	}

	@DeleteMapping("/rooms/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		rooms.delete(id);
	}

}
