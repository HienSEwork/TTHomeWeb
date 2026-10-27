package vn.tthome.crm.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import vn.tthome.crm.models.dtos.CollaboratorSummary;
import vn.tthome.crm.models.dtos.CommissionRequest;
import vn.tthome.crm.models.dtos.CommissionResponse;
import vn.tthome.crm.models.dtos.CommissionStatusRequest;
import vn.tthome.crm.models.dtos.CommissionUpdateRequest;
import vn.tthome.crm.services.commission.CommissionService;
import vn.tthome.common.security.AccessClaims;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/crm")
@PreAuthorize("hasRole('ADMIN')")
public class CommissionController {

	private final CommissionService commissions;

	public CommissionController(CommissionService commissions) {
		this.commissions = commissions;
	}

	@GetMapping("/collaborators")
	public PageResponse<CollaboratorSummary> collaborators(@RequestParam(required = false) UUID referrerUserId,
			@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return commissions.collaborators(referrerUserId, page, size);
	}

	@GetMapping("/commissions")
	public PageResponse<CommissionResponse> list(@RequestParam(required = false) UUID referrerUserId,
			@RequestParam(required = false) UUID customerId, @RequestParam(required = false) @Size(max = 16) String status,
			@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return commissions.list(referrerUserId, customerId, status, page, size);
	}

	@GetMapping("/commissions/{id}")
	public CommissionResponse get(@PathVariable UUID id) {
		return commissions.get(id);
	}

	@PostMapping("/commissions")
	@ResponseStatus(HttpStatus.CREATED)
	public CommissionResponse create(@AuthenticationPrincipal AccessClaims claims, @Valid @RequestBody CommissionRequest body) {
		return commissions.create(claims.userId(), body);
	}

	@PutMapping("/commissions/{id}")
	public CommissionResponse update(@PathVariable UUID id, @Valid @RequestBody CommissionUpdateRequest body) {
		return commissions.update(id, body);
	}

	@PutMapping("/commissions/{id}/status")
	public CommissionResponse setStatus(@PathVariable UUID id, @Valid @RequestBody CommissionStatusRequest body) {
		return commissions.setStatus(id, body.status());
	}

}
