package vn.tthome.search.services.nearby.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import vn.tthome.search.commons.GeoUtils;
import vn.tthome.search.commons.SearchFilters;
import vn.tthome.search.models.dtos.NearbyItemResponse;
import vn.tthome.search.models.dtos.NearbyResponse;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.mappers.ListingMapper;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.nearby.NearbyService;

@Service
public class NearbyServiceImpl implements NearbyService {

	private final ListingDocRepository listings;

	public NearbyServiceImpl(ListingDocRepository listings) {
		this.listings = listings;
	}

	@Override
	public NearbyResponse nearby(Double lat, Double lng, Integer radiusM, SearchParams filters, Integer limit) {
		if (lat == null || lng == null || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
			throw SearchFilters.invalid("lat and lng are required and must be valid coordinates");
		}
		int radius = radiusM == null ? DEFAULT_RADIUS_M : radiusM;
		if (radius < 1 || radius > MAX_RADIUS_M) {
			throw SearchFilters.invalid("radius_m must be between 1 and " + MAX_RADIUS_M);
		}
		int max = limit == null ? DEFAULT_LIMIT : limit;
		if (max < 1 || max > MAX_LIMIT) {
			throw SearchFilters.invalid("limit must be between 1 and " + MAX_LIMIT);
		}
		List<NearbyItemResponse> items = listings.findNearby(SearchFilters.from(filters), lat, lng, radius, max)
				.stream()
				.map(d -> new NearbyItemResponse(GeoUtils.distanceKm(lat, lng, d.lat(), d.lng()), ListingMapper.toItem(d)))
				.toList();
		return new NearbyResponse(items.size(), items);
	}

}
