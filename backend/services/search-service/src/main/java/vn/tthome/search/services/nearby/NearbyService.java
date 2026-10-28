package vn.tthome.search.services.nearby;

import vn.tthome.search.models.dtos.NearbyResponse;
import vn.tthome.search.models.dtos.SearchParams;

public interface NearbyService {

	int DEFAULT_RADIUS_M = 2000;
	int MAX_RADIUS_M = 20_000;
	int DEFAULT_LIMIT = 20;
	int MAX_LIMIT = 50;

	/** Rooms within {@code radiusM} metres of the point, nearest first. Throws a 400 {@code ApiException} when invalid. */
	NearbyResponse nearby(Double lat, Double lng, Integer radiusM, SearchParams filters, Integer limit);

}
