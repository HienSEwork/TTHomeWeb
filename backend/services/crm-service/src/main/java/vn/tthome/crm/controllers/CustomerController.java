package vn.tthome.crm.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.crm.models.dtos.AssignRequest;
import vn.tthome.crm.models.dtos.CustomerRequest;
import vn.tthome.crm.models.dtos.CustomerResponse;
import vn.tthome.crm.models.dtos.CustomerStageRequest;
import vn.tthome.crm.models.dtos.InteractionRequest;
import vn.tthome.crm.models.dtos.InteractionResponse;
import vn.tthome.crm.models.dtos.NoteRequest;
import vn.tthome.crm.models.dtos.NoteResponse;
import vn.tthome.crm.services.carehistory.CareHistoryService;
import vn.tthome.crm.services.customer.CustomerService;
import vn.tthome.common.security.AccessClaims;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/crm/customers")
@PreAuthorize("hasRole('ADMIN')")
public class CustomerController {

	private final CustomerService customers;
	private final CareHistoryService care;

	public CustomerController(CustomerService customers, CareHistoryService care) {
		this.customers = customers;
		this.care = care;
	}

	@GetMapping
	public PageResponse<CustomerResponse> list(@RequestParam(required = false) @Size(max = 16) String stage,
			@RequestParam(required = false) UUID ownerUserId, @RequestParam(required = false) @Size(max = 16) String source,
			@RequestParam(required = false) @Size(max = 100) String q, @RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return customers.list(stage, ownerUserId, source, q, page, size);
	}

	@GetMapping("/{id}")
	public CustomerResponse get(@PathVariable UUID id) {
		return customers.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CustomerResponse create(@Valid @RequestBody CustomerRequest body) {
		return customers.create(body);
	}

	@PutMapping("/{id}")
	public CustomerResponse update(@PathVariable UUID id, @Valid @RequestBody CustomerRequest body) {
		return customers.update(id, body);
	}

	@PutMapping("/{id}/stage")
	public CustomerResponse setStage(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@Valid @RequestBody CustomerStageRequest body) {
		return customers.setStage(claims.userId(), id, body);
	}

	@PutMapping("/{id}/owner")
	public CustomerResponse assignOwner(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@RequestBody AssignRequest body) {
		return customers.assignOwner(claims.userId(), id, body.userId());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		customers.delete(id);
	}

	@GetMapping("/{id}/interactions")
	public PageResponse<InteractionResponse> interactions(@PathVariable UUID id,
			@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "50") @Min(1) @Max(200) int size) {
		return care.interactions(id, page, size);
	}

	@PostMapping("/{id}/interactions")
	@ResponseStatus(HttpStatus.CREATED)
	public InteractionResponse addInteraction(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@Valid @RequestBody InteractionRequest body) {
		return care.addInteraction(claims.userId(), id, body);
	}

	@GetMapping("/{id}/notes")
	public List<NoteResponse> notes(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id) {
		return care.notes(claims.userId(), id);
	}

	@PostMapping("/{id}/notes")
	@ResponseStatus(HttpStatus.CREATED)
	public NoteResponse addNote(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@Valid @RequestBody NoteRequest body) {
		return care.addNote(claims.userId(), id, body);
	}

}
