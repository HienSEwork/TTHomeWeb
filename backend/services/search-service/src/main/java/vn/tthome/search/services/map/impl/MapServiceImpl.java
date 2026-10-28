package vn.tthome.search.services.map.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import vn.tthome.search.commons.GeoUtils;
import vn.tthome.search.commons.SearchFilters;
import vn.tthome.search.models.dtos.BoundingBox;
import vn.tthome.search.models.dtos.MapPinResponse;
import vn.tthome.search.models.dtos.MapResponse;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.map.MapService;

@Service
public class MapServiceImpl implements MapService {

	private final ListingDocRepository listings;

	public MapServiceImpl(ListingDocRepository listings) {
		this.listings = listings;
	}

	@Override
	public MapResponse pins(String bbox, SearchParams filters, Integer limit) {
		BoundingBox box = GeoUtils.parseBbox(bbox);
		int max = limit == null ? DEFAULT_LIMIT : limit;
		if (max < 1 || max > MAX_LIMIT) {
			throw SearchFilters.invalid("limit must be between 1 and " + MAX_LIMIT);
		}
		SearchFilterRequest filter = SearchFilters.from(filters);
		List<MapPinResponse> pins = listings.findInBoundingBox(filter, box, max).stream().map(MapServiceImpl::toPin)
				.toList();
		return new MapResponse(pins.size(), pins);
	}

	private static MapPinResponse toPin(ListingDoc d) {
		Long price = d.price() == null ? null : d.price().longValue();
		return new MapPinResponse(d.roomId(), d.lat(), d.lng(), price, price == null ? null : GeoUtils.priceLabel(price),
				d.projectName(), d.projectName(), d.roomSlug(), d.coverUrl(), d.roomType(), d.hasBalcony(),
				d.petPolicy());
	}

}
