package vn.tthome.search.services.similar.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import vn.tthome.common.error.ApiException;
import vn.tthome.search.models.dtos.ListingItemResponse;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.models.mappers.ListingMapper;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.similar.SimilarRoomService;

@Service
public class SimilarRoomServiceImpl implements SimilarRoomService {

	private final ListingDocRepository listings;

	public SimilarRoomServiceImpl(ListingDocRepository listings) {
		this.listings = listings;
	}

	@Override
	public List<ListingItemResponse> similar(UUID roomId) {
		ListingDoc base = listings.findById(roomId)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "room not found"));
		if (base.price() == null || base.districtId() == null || base.roomType() == null) {
			return List.of();
		}
		return listings.findSimilar(base, LIMIT).stream().map(ListingMapper::toItem).toList();
	}

}
