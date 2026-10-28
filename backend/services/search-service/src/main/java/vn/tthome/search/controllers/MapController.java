package vn.tthome.search.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.tthome.search.models.dtos.MapResponse;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.services.map.MapService;

@RestController
@RequestMapping("/api/v1/map")
@Tag(name = "Map")
public class MapController {

	private final MapService map;

	public MapController(MapService map) {
		this.map = map;
	}

	@GetMapping
	@Operation(summary = "Room pins inside the map viewport, for drawing markers over the Carto basemap")
	public MapResponse pins(
			@Parameter(description = "Viewport minLng,minLat,maxLng,maxLat", example = "105.70,10.00,105.80,10.08", required = true) @RequestParam(required = false) String bbox,
			@RequestParam(name = "price_min", required = false) Long priceMin,
			@RequestParam(name = "price_max", required = false) Long priceMax,
			@RequestParam(name = "district_id", required = false) Integer districtId,
			@RequestParam(name = "ward_id", required = false) Integer wardId,
			@Parameter(description = "studio, duplex, 1pn, 2pn, 3pn, shared, dorm, room; repeat or comma-separate") @RequestParam(name = "room_type", required = false) List<String> roomType,
			@Parameter(description = "Amenity ids the room must have all of") @RequestParam(required = false) List<Short> amenities,
			@RequestParam(name = "area_min", required = false) Double areaMin,
			@RequestParam(name = "area_max", required = false) Double areaMax,
			@Parameter(description = "full, basic or none") @RequestParam(required = false) String furniture,
			@RequestParam(required = false) Boolean balcony,
			@RequestParam(required = false) Boolean window,
			@RequestParam(required = false) Boolean exclusive,
			@Parameter(description = "Shortcut: pets allowed") @RequestParam(required = false) Boolean pet,
			@Parameter(description = "Shortcut: electric vehicle parking") @RequestParam(name = "ev_parking", required = false) Boolean evParking,
			@Parameter(description = "Shortcut: promotional rooms") @RequestParam(required = false) Boolean promo,
			@Parameter(description = "Max pins, 1-500, default 200") @RequestParam(required = false) Integer limit) {
		SearchParams filters = new SearchParams(null, priceMin, priceMax, districtId, wardId, roomType, amenities,
				areaMin, areaMax, furniture, balcony, window, exclusive, pet, evParking, promo, null, null, null);
		return map.pins(bbox, filters, limit);
	}

}
