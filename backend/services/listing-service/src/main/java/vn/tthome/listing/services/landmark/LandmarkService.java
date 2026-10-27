package vn.tthome.listing.services.landmark;

import java.util.List;

import vn.tthome.listing.models.dtos.LandmarkRequest;
import vn.tthome.listing.models.dtos.LandmarkResponse;

public interface LandmarkService {

	/** Every landmark, in display order. */
	List<LandmarkResponse> list();

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown landmark. */
	LandmarkResponse get(short id);

	/** @throws vn.tthome.common.error.ApiException 409 CONFLICT when the code is taken. */
	LandmarkResponse create(LandmarkRequest request);

	/**
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown landmark, 409 CONFLICT when the code is
	 *         taken.
	 */
	LandmarkResponse update(short id, LandmarkRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown landmark. */
	void delete(short id);

}
