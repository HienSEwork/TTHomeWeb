package vn.tthome.crm.services.commission;

import java.util.UUID;

import vn.tthome.crm.models.dtos.CollaboratorSummary;
import vn.tthome.crm.models.dtos.CommissionRequest;
import vn.tthome.crm.models.dtos.CommissionResponse;
import vn.tthome.crm.models.dtos.CommissionUpdateRequest;
import vn.tthome.common.web.PageResponse;

/** Collaborators (people who refer customers) and the commission they earn. */
public interface CommissionService {

	/** The collaborators with at least one live referred customer, the busiest first. */
	PageResponse<CollaboratorSummary> collaborators(UUID referrerUserId, int page, int size);

	/** One page of commissions, newest first; blank filters are ignored. */
	PageResponse<CommissionResponse> list(UUID referrerUserId, UUID customerId, String status, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown commission. */
	CommissionResponse get(UUID id);

	/**
	 * Records a commission for a customer who has rented; it goes to the collaborator who referred them and starts
	 * pending.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown customer, 400 VALIDATION_ERROR when
	 *         the customer has no referrer or has not rented, 409 CONFLICT when the customer already has a commission.
	 */
	CommissionResponse create(UUID admin, CommissionRequest request);

	/**
	 * Changes the amount or note of a commission that is not yet approved.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT once it is approved, paid or cancelled.
	 */
	CommissionResponse update(UUID id, CommissionUpdateRequest request);

	/**
	 * Approves (from pending), pays (from approved) or cancels (from pending or approved) a commission. Paying stamps
	 * the time. Paid and cancelled are final.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a move that is not allowed.
	 */
	CommissionResponse setStatus(UUID id, String status);

}
