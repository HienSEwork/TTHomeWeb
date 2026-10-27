package vn.tthome.crm.services.carehistory;

import java.util.List;
import java.util.UUID;

import vn.tthome.crm.models.dtos.InteractionRequest;
import vn.tthome.crm.models.dtos.InteractionResponse;
import vn.tthome.crm.models.dtos.NoteRequest;
import vn.tthome.crm.models.dtos.NoteResponse;
import vn.tthome.common.web.PageResponse;

/** The care history of a customer: contacts made with them and the notes staff keep about them. */
public interface CareHistoryService {

	/** The history, newest first. @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown customer. */
	PageResponse<InteractionResponse> interactions(UUID customerId, int page, int size);

	/**
	 * Records a contact and stamps it as the customer's last contact.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown customer.
	 */
	InteractionResponse addInteraction(UUID admin, UUID customerId, InteractionRequest request);

	/** The notes the reader may see, newest first: public ones and the reader's own private ones. */
	List<NoteResponse> notes(UUID reader, UUID customerId);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown customer. */
	NoteResponse addNote(UUID author, UUID customerId, NoteRequest request);

}
