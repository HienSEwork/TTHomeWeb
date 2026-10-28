package vn.tthome.search.repos.listingdoc;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import vn.tthome.search.models.dtos.BoundingBox;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SuggestItemResponse;
import vn.tthome.search.models.entities.ListingDoc;

/**
 * Read-only access to {@code search.listing_doc}. Every query only sees rooms with
 * {@code status = 'available'}. The table is a flat read model written by event listeners,
 * so this is a plain interface (no JPA) implemented with {@code JdbcClient}.
 */
public interface ListingDocRepository {

	List<ListingDoc> search(SearchFilterRequest filter);

	long count(SearchFilterRequest filter);

	/** Rooms with coordinates inside the viewport that match the filter, most popular first, at most {@code limit}. */
	List<ListingDoc> findInBoundingBox(SearchFilterRequest filter, BoundingBox bbox, int limit);

	/** Rooms matching the filter within {@code radiusM} metres (great-circle) of the point, nearest first. */
	List<ListingDoc> findNearby(SearchFilterRequest filter, double lat, double lng, int radiusM, int limit);

	/** Projects with an available room whose text contains the keyword, largest first. */
	List<SuggestItemResponse> suggestProjects(String keyword, int limit);

	Optional<ListingDoc> findById(UUID roomId);

	/** Available rooms other than {@code base} in its district and type with a price within 20%, closest price first. */
	List<ListingDoc> findSimilar(ListingDoc base, int limit);

}
