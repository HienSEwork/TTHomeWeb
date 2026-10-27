package vn.tthome.crm.services.commission.impl;

import java.math.BigDecimal;
import java.time.Clock;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.crm.models.dtos.CollaboratorSummary;
import vn.tthome.crm.models.dtos.CommissionRequest;
import vn.tthome.crm.models.dtos.CommissionResponse;
import vn.tthome.crm.models.dtos.CommissionUpdateRequest;
import vn.tthome.crm.models.entities.Commission;
import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.repos.commission.CommissionRepository;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.services.commission.CommissionService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class CommissionServiceImpl implements CommissionService {

	private static final Map<String, Set<String>> MOVES = Map.of(
			"pending", Set.of("approved", "cancelled"),
			"approved", Set.of("paid", "cancelled"));

	private final CommissionRepository commissions;
	private final CustomerRepository customers;
	private final Clock clock;

	public CommissionServiceImpl(CommissionRepository commissions, CustomerRepository customers, Clock clock) {
		this.commissions = commissions;
		this.customers = customers;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<CollaboratorSummary> collaborators(UUID referrerUserId, int page, int size) {
		return PageResponse.of(commissions.collaborators(referrerUserId, PageRequest.of(page, size)), summary -> summary);
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<CommissionResponse> list(UUID referrerUserId, UUID customerId, String status, int page, int size) {
		return PageResponse.of(commissions.search(referrerUserId, customerId, blank(status), PageRequest.of(page, size)),
				CommissionResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public CommissionResponse get(UUID id) {
		return CommissionResponse.from(find(id));
	}

	@Override
	@Transactional
	public CommissionResponse create(UUID admin, CommissionRequest request) {
		Customer customer = customers.findByIdAndDeletedAtIsNull(request.customerId())
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Customer not found"));
		if (customer.getReferrerUserId() == null) {
			throw invalid("The customer was not referred by a collaborator");
		}
		if (!customer.getStage().equals("rented")) {
			throw invalid("A commission is only recorded once the customer has rented");
		}
		if (commissions.existsByCustomerIdAndStatusNot(customer.getId(), "cancelled")) {
			throw conflict("The customer already has a commission");
		}
		Commission commission = new Commission();
		commission.setId(UUID.randomUUID());
		commission.setCustomerId(customer.getId());
		commission.setReferrerUserId(customer.getReferrerUserId());
		commission.setAmount(BigDecimal.valueOf(request.amount()));
		commission.setNote(note(request.note()));
		commission.setCreatedBy(admin);
		return CommissionResponse.from(commissions.saveAndFlush(commission));
	}

	@Override
	@Transactional
	public CommissionResponse update(UUID id, CommissionUpdateRequest request) {
		Commission commission = find(id);
		if (!commission.getStatus().equals("pending")) {
			throw conflict("A commission that is " + commission.getStatus() + " can no longer be changed");
		}
		commission.setAmount(BigDecimal.valueOf(request.amount()));
		commission.setNote(note(request.note()));
		return CommissionResponse.from(commissions.saveAndFlush(commission));
	}

	@Override
	@Transactional
	public CommissionResponse setStatus(UUID id, String status) {
		Commission commission = find(id);
		if (!MOVES.getOrDefault(commission.getStatus(), Set.of()).contains(status)) {
			throw conflict("A commission that is " + commission.getStatus() + " cannot become " + status);
		}
		commission.setStatus(status);
		if (status.equals("paid")) {
			commission.setPaidAt(clock.instant());
		}
		commissions.saveAndFlush(commission);
		return CommissionResponse.from(commission);
	}

	private Commission find(UUID id) {
		return commissions.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Commission not found"));
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String note(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
