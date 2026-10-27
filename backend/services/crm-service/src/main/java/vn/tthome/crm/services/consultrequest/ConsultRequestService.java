package vn.tthome.crm.services.consultrequest;

import java.util.UUID;

import vn.tthome.crm.models.dtos.ConsultRequestResponse;
import vn.tthome.common.web.PageResponse;

/** Follow-up of the "please advise me" forms: who takes each one and how far it has got. */
public interface ConsultRequestService {

	/** One page of requests, newest first; blank filters are ignored. */
	PageResponse<ConsultRequestResponse> list(String status, UUID assignedTo, String text, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown request. */
	ConsultRequestResponse get(UUID id);

	/**
	 * Gives the request to a staff member. A new request becomes "assigned"; one already being worked on keeps its
	 * status. Removing the assignment (null) is only possible while the request is still "assigned" and sends it
	 * back to "new".
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a request that is done or spam, or
	 *         for removing the assignment of one that is being worked on.
	 */
	ConsultRequestResponse assign(UUID id, UUID staffId);

	/**
	 * Marks the request contacted (from assigned), done (from assigned or contacted) or spam (from new, assigned or
	 * contacted).
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a move that is not allowed.
	 */
	ConsultRequestResponse setStatus(UUID id, String status);

}
