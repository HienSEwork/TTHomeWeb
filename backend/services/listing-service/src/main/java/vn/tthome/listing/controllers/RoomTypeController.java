package vn.tthome.listing.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * The room types are a fixed list enforced by a database constraint, so they are read-only here; adding one needs a
 * migration.
 */
@RestController
@RequestMapping("/api/v1/admin/catalog/room-types")
@PreAuthorize("hasRole('ADMIN')")
public class RoomTypeController {

	private static final List<String> ROOM_TYPES = List.of("studio", "duplex", "1pn", "2pn", "3pn", "shared", "dorm",
			"room");

	@GetMapping
	public List<String> list() {
		return ROOM_TYPES;
	}

}
