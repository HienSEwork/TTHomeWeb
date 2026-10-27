package vn.tthome.crm.services.customer.impl;

import java.time.Clock;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.crm.models.dtos.CustomerRequest;
import vn.tthome.crm.models.dtos.CustomerResponse;
import vn.tthome.crm.models.dtos.CustomerStageRequest;
import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.models.entities.Interaction;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.repos.interaction.InteractionRepository;
import vn.tthome.crm.services.customer.CustomerService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class CustomerServiceImpl implements CustomerService {

	private final CustomerRepository customers;
	private final InteractionRepository interactions;
	private final Clock clock;

	public CustomerServiceImpl(CustomerRepository customers, InteractionRepository interactions, Clock clock) {
		this.customers = customers;
		this.interactions = interactions;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<CustomerResponse> list(String stage, UUID ownerUserId, String source, String text, int page,
			int size) {
		return PageResponse.of(customers.search(blank(stage), ownerUserId, blank(source), blank(text), PageRequest.of(page, size)),
				CustomerResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public CustomerResponse get(UUID id) {
		return CustomerResponse.from(find(id));
	}

	@Override
	@Transactional
	public CustomerResponse create(CustomerRequest request) {
		if (request.phone() != null && customers.existsByPhoneAndDeletedAtIsNull(request.phone())) {
			throw conflict("Another customer has this phone number");
		}
		Customer customer = new Customer();
		customer.setId(UUID.randomUUID());
		apply(customer, request);
		return CustomerResponse.from(customers.saveAndFlush(customer));
	}

	@Override
	@Transactional
	public CustomerResponse update(UUID id, CustomerRequest request) {
		Customer customer = find(id);
		if (request.phone() != null && customers.existsByPhoneAndDeletedAtIsNullAndIdNot(request.phone(), id)) {
			throw conflict("Another customer has this phone number");
		}
		apply(customer, request);
		return CustomerResponse.from(customers.saveAndFlush(customer));
	}

	@Override
	@Transactional
	public CustomerResponse setStage(UUID admin, UUID id, CustomerStageRequest request) {
		Customer customer = find(id);
		String from = customer.getStage();
		String to = request.stage();
		if (from.equals(to)) {
			throw conflict("The customer is already " + to);
		}
		boolean lost = to.equals("lost");
		if (lost && (request.lostReason() == null || request.lostReason().isBlank())) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "A lost customer needs a reason");
		}
		customer.setStage(to);
		customer.setLostReason(lost ? request.lostReason().strip() : null);
		customers.saveAndFlush(customer);
		record(id, "stage_change", admin, from + " -> " + to + (lost ? ": " + request.lostReason().strip() : ""));
		return CustomerResponse.from(customer);
	}

	@Override
	@Transactional
	public CustomerResponse assignOwner(UUID admin, UUID id, UUID ownerUserId) {
		Customer customer = find(id);
		customer.setOwnerUserId(ownerUserId);
		customers.saveAndFlush(customer);
		record(id, "system", admin, ownerUserId == null ? "Owner removed" : "Owner assigned: " + ownerUserId);
		return CustomerResponse.from(customer);
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Customer customer = find(id);
		customer.setDeletedAt(clock.instant());
		customers.saveAndFlush(customer);
	}

	private void record(UUID customerId, String kind, UUID actor, String summary) {
		Interaction row = new Interaction();
		row.setId(UUID.randomUUID());
		row.setCustomerId(customerId);
		row.setKind(kind);
		row.setActorId(actor);
		row.setSummary(summary);
		interactions.saveAndFlush(row);
	}

	private static void apply(Customer customer, CustomerRequest r) {
		customer.setFullName(r.fullName().strip());
		customer.setPhone(r.phone());
		customer.setEmail(r.email() == null || r.email().isBlank() ? null : r.email().strip().toLowerCase());
		customer.setZalo(r.zalo() == null || r.zalo().isBlank() ? null : r.zalo().strip());
		customer.setSource(r.source());
		customer.setReferrerUserId(r.referrerUserId());
		customer.setPriority(r.priority());
		customer.setNextFollowupAt(r.nextFollowupAt());
	}

	private Customer find(UUID id) {
		return customers.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Customer not found"));
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
