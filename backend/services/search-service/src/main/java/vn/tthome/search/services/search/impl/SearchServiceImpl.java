package vn.tthome.search.services.search.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import vn.tthome.search.commons.SearchFilters;
import vn.tthome.search.models.dtos.ListingItemResponse;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.dtos.SearchResponse;
import vn.tthome.search.models.mappers.ListingMapper;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.search.SearchService;

@Service
public class SearchServiceImpl implements SearchService {

	private final ListingDocRepository listings;

	public SearchServiceImpl(ListingDocRepository listings) {
		this.listings = listings;
	}

	@Override
	public SearchResponse search(SearchParams params) {
		SearchFilterRequest filter = SearchFilters.from(params);
		long total = listings.count(filter);
		List<ListingItemResponse> items = total == 0 || filter.offset() >= total ? List.of()
				: listings.search(filter).stream().map(ListingMapper::toItem).toList();
		int totalPages = (int) ((total + filter.limit() - 1) / filter.limit());
		return new SearchResponse(items, filter.page(), filter.limit(), total, totalPages);
	}

}
