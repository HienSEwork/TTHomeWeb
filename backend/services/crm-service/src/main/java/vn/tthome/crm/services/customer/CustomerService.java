package vn.tthome.crm.services.customer;

import java.util.UUID;

import vn.tthome.crm.models.dtos.CustomerRequest;
import vn.tthome.crm.models.dtos.CustomerResponse;
import vn.tthome.crm.models.dtos.CustomerStageRequest;
import vn.tthome.common.web.PageResponse;

/** Administration of customers: details, pipeline stage and the staff member who looks after them. */
public interface CustomerService {

	/** One page of customers, newest first; blank filters are ignored. */
	PageResponse<CustomerResponse> list(String stage, UUID ownerUserId, String source, String text, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted customer. */
	CustomerResponse get(UUID id);

	/**
	 * Creates a customer in the "new" stage.
	 *
	 * @throws vn.tthome.common.error.ApiException 409 CONFLICT when another customer has the same phone number.
	 */
	CustomerResponse create(CustomerRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for the phone of another customer. */
	CustomerResponse update(UUID id, CustomerRequest request);

	/**
	 * Moves the customer to another stage and writes the change into the care history.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT when the customer is already in that
	 *         stage, 400 VALIDATION_ERROR for "lost" without a reason.
	 */
	CustomerResponse setStage(UUID admin, UUID id, CustomerStageRequest request);

	/** Assigns the customer to a staff member (null removes it) and writes it into the care history. */
	CustomerResponse assignOwner(UUID admin, UUID id, UUID ownerUserId);

	/** Deletes the customer (kept in the database, no longer visible; the phone number becomes free). */
	void delete(UUID id);

}
