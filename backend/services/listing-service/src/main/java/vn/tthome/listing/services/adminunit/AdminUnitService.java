package vn.tthome.listing.services.adminunit;

import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.AdminUnitCreateRequest;
import vn.tthome.listing.models.dtos.AdminUnitResponse;
import vn.tthome.listing.models.dtos.AdminUnitUpdateRequest;

/** Administration of the province, district and ward catalog. */
public interface AdminUnitService {

	/** One page of units; blank filters are ignored. */
	PageResponse<AdminUnitResponse> list(String scheme, Short level, Integer parentId, String text, int page,
			int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown unit. */
	AdminUnitResponse get(int id);

	/**
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR when the parent does not fit (a province has
	 *         none; a district or ward needs a parent one level up in the same scheme), 409 CONFLICT for a taken id or
	 *         a slug already used under the same parent.
	 */
	AdminUnitResponse create(AdminUnitCreateRequest request);

	/**
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown unit, 409 CONFLICT for a slug already
	 *         used under the same parent.
	 */
	AdminUnitResponse update(int id, AdminUnitUpdateRequest request);

	/**
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown unit, 409 CONFLICT while the unit has
	 *         children or is used by a project, a mapping or the area statistics.
	 */
	void delete(int id);

}
