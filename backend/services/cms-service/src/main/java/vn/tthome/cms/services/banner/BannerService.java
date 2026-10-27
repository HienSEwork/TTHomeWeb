package vn.tthome.cms.services.banner;

import java.util.List;
import java.util.UUID;

import vn.tthome.cms.models.dtos.BannerRequest;
import vn.tthome.cms.models.dtos.BannerResponse;

public interface BannerService {

	/** The banners that match every given filter (blank filters are ignored), in display order. */
	List<BannerResponse> list(String locale, String placement, Boolean active);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown banner. */
	BannerResponse get(UUID id);

	/** @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for values that do not fit together. */
	BannerResponse create(BannerRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR as for create. */
	BannerResponse update(UUID id, BannerRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown banner. */
	void delete(UUID id);

}
