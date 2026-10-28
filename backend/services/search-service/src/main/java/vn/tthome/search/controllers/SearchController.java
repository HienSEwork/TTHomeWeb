package vn.tthome.search.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.dtos.SearchResponse;
import vn.tthome.search.services.search.SearchService;

@RestController
@RequestMapping("/api/v1/search")
@Tag(name = "Search")
public class SearchController {

	private final SearchService search;

	public SearchController(SearchService search) {
		this.search = search;
	}

	@GetMapping
	@Operation(summary = "Search available rooms by keyword and filters")
	public SearchResponse search(
			@Parameter(description = "Keyword: project, street, ward or landmark; diacritics optional") @RequestParam(required = false) String q,
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
			@Parameter(description = "NEWEST (default), PRICE_ASC, PRICE_DESC, POPULAR") @RequestParam(required = false) String sort,
			@Parameter(description = "1-based page, default 1") @RequestParam(required = false) Integer page,
			@Parameter(description = "Page size 1-50, default 20") @RequestParam(required = false) Integer limit) {
		return search.search(new SearchParams(q, priceMin, priceMax, districtId, wardId, roomType, amenities, areaMin,
				areaMax, furniture, balcony, window, exclusive, pet, evParking, promo, sort, page, limit));
	}

}
