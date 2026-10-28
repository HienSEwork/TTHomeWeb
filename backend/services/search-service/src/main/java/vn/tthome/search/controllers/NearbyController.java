package vn.tthome.search.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.tthome.search.models.dtos.NearbyResponse;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.services.nearby.NearbyService;

@RestController
@RequestMapping("/api/v1/nearby")
@Tag(name = "Nearby")
public class NearbyController {

	private final NearbyService nearby;

	public NearbyController(NearbyService nearby) {
		this.nearby = nearby;
	}

	@GetMapping
	@Operation(summary = "Rooms around a point (a university, a landmark or the visitor position), nearest first")
	public NearbyResponse nearby(
			@Parameter(description = "Centre latitude", example = "10.0299", required = true) @RequestParam(required = false) Double lat,
			@Parameter(description = "Centre longitude", example = "105.7700", required = true) @RequestParam(required = false) Double lng,
			@Parameter(description = "Radius in metres, 1-20000, default 2000") @RequestParam(name = "radius_m", required = false) Integer radiusM,
			@RequestParam(name = "price_min", required = false) Long priceMin,
			@RequestParam(name = "price_max", required = false) Long priceMax,
			@Parameter(description = "studio, duplex, 1pn, 2pn, 3pn, shared, dorm, room; repeat or comma-separate") @RequestParam(name = "room_type", required = false) List<String> roomType,
			@Parameter(description = "Amenity ids the room must have all of") @RequestParam(required = false) List<Short> amenities,
			@Parameter(description = "Shortcut: pets allowed") @RequestParam(required = false) Boolean pet,
			@Parameter(description = "Shortcut: electric vehicle parking") @RequestParam(name = "ev_parking", required = false) Boolean evParking,
			@Parameter(description = "Shortcut: promotional rooms") @RequestParam(required = false) Boolean promo,
			@Parameter(description = "Max rooms, 1-50, default 20") @RequestParam(required = false) Integer limit) {
		SearchParams filters = new SearchParams(null, priceMin, priceMax, null, null, roomType, amenities, null, null,
				null, null, null, null, pet, evParking, promo, null, null, null);
		return nearby.nearby(lat, lng, radiusM, filters, limit);
	}

}
