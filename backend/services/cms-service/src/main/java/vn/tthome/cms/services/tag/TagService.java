package vn.tthome.cms.services.tag;

import java.util.List;
import java.util.UUID;

import vn.tthome.cms.models.dtos.TagRequest;
import vn.tthome.cms.models.dtos.TagResponse;

public interface TagService {

	/** The tags that match every given filter (blank filters are ignored), in display order. */
	List<TagResponse> list(String locale);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown tag. */
	TagResponse get(UUID id);

	/** @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for values that do not fit together. */
	TagResponse create(TagRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR as for create. */
	TagResponse update(UUID id, TagRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown tag, 409 CONFLICT while posts use it. */
	void delete(UUID id);

}
