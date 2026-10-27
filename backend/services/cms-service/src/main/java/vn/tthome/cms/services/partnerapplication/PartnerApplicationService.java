package vn.tthome.cms.services.partnerapplication;

import java.util.UUID;

import vn.tthome.cms.models.dtos.PartnerApplicationResponse;
import vn.tthome.common.web.PageResponse;

/** Review of the applications to become a collaborator (kind "ctv") or to join the team (kind "job"). */
public interface PartnerApplicationService {

	/** One page of applications, newest first; blank filters are ignored. */
	PageResponse<PartnerApplicationResponse> list(String kind, String status, String text, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown application. */
	PartnerApplicationResponse get(UUID id);

	/**
	 * Marks the application contacted (from new), or approved or rejected (from new or contacted). Approved and
	 * rejected are final.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a move that is not allowed.
	 */
	PartnerApplicationResponse setStatus(UUID id, String status);

}
