package vn.tthome.cms.services.category;

import java.util.List;
import java.util.UUID;

import vn.tthome.cms.models.dtos.CategoryRequest;
import vn.tthome.cms.models.dtos.CategoryResponse;

public interface CategoryService {

	/** The categories that match every given filter (blank filters are ignored), in display order. */
	List<CategoryResponse> list(String locale);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown category. */
	CategoryResponse get(UUID id);

	/** @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for values that do not fit together. */
	CategoryResponse create(CategoryRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR as for create. */
	CategoryResponse update(UUID id, CategoryRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown category, 409 CONFLICT while it has children or posts. */
	void delete(UUID id);

}
