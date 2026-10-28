package vn.tthome.search.services.search;

import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.dtos.SearchResponse;

public interface SearchService {

	/** Throws a 400 {@code ApiException} when a parameter is invalid. */
	SearchResponse search(SearchParams params);

}
