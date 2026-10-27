package vn.tthome.crm.services.carehistory.impl;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.crm.models.dtos.InteractionRequest;
import vn.tthome.crm.models.dtos.InteractionResponse;
import vn.tthome.crm.models.dtos.NoteRequest;
import vn.tthome.crm.models.dtos.NoteResponse;
import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.models.entities.CustomerNote;
import vn.tthome.crm.models.entities.Interaction;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.repos.interaction.InteractionRepository;
import vn.tthome.crm.repos.note.CustomerNoteRepository;
import vn.tthome.crm.services.carehistory.CareHistoryService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class CareHistoryServiceImpl implements CareHistoryService {

	private final CustomerRepository customers;
	private final InteractionRepository interactions;
	private final CustomerNoteRepository notes;
	private final Clock clock;

	public CareHistoryServiceImpl(CustomerRepository customers, InteractionRepository interactions,
			CustomerNoteRepository notes, Clock clock) {
		this.customers = customers;
		this.interactions = interactions;
		this.notes = notes;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<InteractionResponse> interactions(UUID customerId, int page, int size) {
		find(customerId);
		return PageResponse.of(interactions.findByCustomerIdOrderByCreatedAtDescIdDesc(customerId, PageRequest.of(page, size)),
				InteractionResponse::from);
	}

	@Override
	@Transactional
	public InteractionResponse addInteraction(UUID admin, UUID customerId, InteractionRequest request) {
		Customer customer = find(customerId);
		Interaction row = new Interaction();
		row.setId(UUID.randomUUID());
		row.setCustomerId(customerId);
		row.setKind(request.kind());
		row.setDirection(request.direction());
		row.setSummary(request.summary().strip());
		row.setActorId(admin);
		interactions.saveAndFlush(row);
		customer.setLastContactAt(clock.instant());
		customers.saveAndFlush(customer);
		return InteractionResponse.from(row);
	}

	@Override
	@Transactional(readOnly = true)
	public List<NoteResponse> notes(UUID reader, UUID customerId) {
		find(customerId);
		return notes.visibleTo(customerId, reader).stream().map(NoteResponse::from).toList();
	}

	@Override
	@Transactional
	public NoteResponse addNote(UUID author, UUID customerId, NoteRequest request) {
		find(customerId);
		CustomerNote note = new CustomerNote();
		note.setId(UUID.randomUUID());
		note.setAuthorId(author);
		note.setCustomerId(customerId);
		note.setBody(request.body().strip());
		note.setPrivateNote(Boolean.TRUE.equals(request.privateNote()));
		return NoteResponse.from(notes.saveAndFlush(note));
	}

	private Customer find(UUID id) {
		return customers.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Customer not found"));
	}

}
