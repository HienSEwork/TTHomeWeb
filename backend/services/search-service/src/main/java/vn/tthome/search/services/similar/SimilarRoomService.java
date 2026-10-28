package vn.tthome.search.services.similar;

import java.util.List;
import java.util.UUID;

import vn.tthome.search.models.dtos.ListingItemResponse;

public interface SimilarRoomService {

	int LIMIT = 4;

	/** Same district and room type, price within 20%, closest price first. Throws a 404 {@code ApiException} for an unknown room. */
	List<ListingItemResponse> similar(UUID roomId);

}
