package vn.tthome.search.services.suggest.impl;

import java.util.List;

import org.springframework.stereotype.Service;

import vn.tthome.search.commons.QueryNormalizer;
import vn.tthome.search.commons.SearchFilters;
import vn.tthome.search.models.dtos.SuggestItemResponse;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.suggest.SuggestService;

@Service
public class SuggestServiceImpl implements SuggestService {

	private static final int MAX_QUERY_LENGTH = 100;

	private final ListingDocRepository listings;

	public SuggestServiceImpl(ListingDocRepository listings) {
		this.listings = listings;
	}

	@Override
	public List<SuggestItemResponse> suggest(String q) {
		String keyword = QueryNormalizer.normalize(q);
		if (keyword.isEmpty()) {
			return List.of();
		}
		if (keyword.length() > MAX_QUERY_LENGTH) {
			throw SearchFilters.invalid("q is too long");
		}
		return listings.suggestProjects(keyword, LIMIT);
	}

}
