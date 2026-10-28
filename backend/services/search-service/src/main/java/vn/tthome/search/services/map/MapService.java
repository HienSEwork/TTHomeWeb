package vn.tthome.search.services.map;

import vn.tthome.search.models.dtos.MapResponse;
import vn.tthome.search.models.dtos.SearchParams;

public interface MapService {

	int DEFAULT_LIMIT = 200;
	int MAX_LIMIT = 500;

	/**
	 * Pins for the given viewport. {@code filters} carries the same filter fields as the search page
	 * (sort and paging are ignored). Throws a 400 {@code ApiException} when a parameter is invalid.
	 */
	MapResponse pins(String bbox, SearchParams filters, Integer limit);

}
