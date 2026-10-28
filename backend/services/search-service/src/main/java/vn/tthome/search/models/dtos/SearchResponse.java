package vn.tthome.search.models.dtos;

import java.util.List;

public record SearchResponse(List<ListingItemResponse> items, int page, int limit, long total, int totalPages) {

}
