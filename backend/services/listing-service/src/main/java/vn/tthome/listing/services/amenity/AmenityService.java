package vn.tthome.listing.services.amenity;

import java.util.List;

import vn.tthome.listing.models.dtos.AmenityRequest;
import vn.tthome.listing.models.dtos.AmenityResponse;

public interface AmenityService {

	/** Every amenity, in display order. */
	List<AmenityResponse> list();

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown amenity. */
	AmenityResponse get(short id);

	/** @throws vn.tthome.common.error.ApiException 409 CONFLICT when the code is taken. */
	AmenityResponse create(AmenityRequest request);

	/**
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown amenity, 409 CONFLICT when the code is
	 *         taken.
	 */
	AmenityResponse update(short id, AmenityRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown amenity, 409 CONFLICT while a project or room uses it. */
	void delete(short id);

}
