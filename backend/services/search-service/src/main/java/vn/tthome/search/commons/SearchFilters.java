package vn.tthome.search.commons;

import java.util.List;
import java.util.Set;

import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.enums.RoomType;
import vn.tthome.search.models.enums.SortOption;

/** Validates raw query parameters and turns them into a {@link SearchFilterRequest}. */
public final class SearchFilters {

	private static final Set<String> FURNITURE = Set.of("full", "basic", "none");
	private static final int MAX_KEYWORD_LENGTH = 100;
	private static final int MAX_AMENITIES = 20;

	private SearchFilters() {
	}

	public static SearchFilterRequest from(SearchParams p) {
		String keyword = QueryNormalizer.normalize(p.q());
		if (keyword.length() > MAX_KEYWORD_LENGTH) {
			throw invalid("q is too long");
		}
		if (p.priceMin() != null && p.priceMin() < 0 || p.priceMax() != null && p.priceMax() < 0) {
			throw invalid("price must not be negative");
		}
		if (p.priceMin() != null && p.priceMax() != null && p.priceMin() > p.priceMax()) {
			throw invalid("price_min must not exceed price_max");
		}
		if (p.areaMin() != null && p.areaMax() != null && p.areaMin() > p.areaMax()) {
			throw invalid("area_min must not exceed area_max");
		}
		String furniture = p.furniture() == null || p.furniture().isBlank() ? null : p.furniture().trim().toLowerCase();
		if (furniture != null && !FURNITURE.contains(furniture)) {
			throw invalid("furniture must be one of full, basic, none");
		}
		if (p.amenities() != null && p.amenities().size() > MAX_AMENITIES) {
			throw invalid("too many amenities");
		}
		SortOption sort = p.sort() == null || p.sort().isBlank() ? SortOption.NEWEST
				: SortOption.parse(p.sort()).orElseThrow(() -> invalid("unknown sort: " + p.sort()));
		int page = p.page() == null ? 1 : p.page();
		int limit = p.limit() == null ? SearchFilterRequest.DEFAULT_LIMIT : p.limit();
		if (page < 1) {
			throw invalid("page must be at least 1");
		}
		if (limit < 1 || limit > SearchFilterRequest.MAX_LIMIT) {
			throw invalid("limit must be between 1 and " + SearchFilterRequest.MAX_LIMIT);
		}
		return new SearchFilterRequest(keyword, p.priceMin(), p.priceMax(), p.districtId(), p.wardId(),
				roomTypes(p.roomType()), p.amenities(), p.areaMin(), p.areaMax(), furniture, p.balcony(),
				p.window(), p.exclusive(), Boolean.TRUE.equals(p.pet()), Boolean.TRUE.equals(p.evParking()),
				Boolean.TRUE.equals(p.promo()), sort, page, limit);
	}

	private static List<RoomType> roomTypes(List<String> raw) {
		if (raw == null) {
			return List.of();
		}
		return raw.stream().flatMap(s -> java.util.Arrays.stream(s.split(","))).filter(s -> !s.isBlank())
				.map(s -> RoomType.parse(s).orElseThrow(() -> invalid("unknown room_type: " + s))).distinct().toList();
	}

	public static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

}
