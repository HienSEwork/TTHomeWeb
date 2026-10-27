package vn.tthome.cms.services.faq;

import java.util.List;
import java.util.UUID;

import vn.tthome.cms.models.dtos.FaqRequest;
import vn.tthome.cms.models.dtos.FaqResponse;

public interface FaqService {

	/** The faqs that match every given filter (blank filters are ignored), in display order. */
	List<FaqResponse> list(String locale, String audience, Boolean active);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown faq. */
	FaqResponse get(UUID id);

	/** @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for values that do not fit together. */
	FaqResponse create(FaqRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR as for create. */
	FaqResponse update(UUID id, FaqRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown faq. */
	void delete(UUID id);

}
