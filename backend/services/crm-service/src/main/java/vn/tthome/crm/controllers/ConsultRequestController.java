package vn.tthome.crm.controllers;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.crm.models.dtos.AssignRequest;
import vn.tthome.crm.models.dtos.ConsultRequestResponse;
import vn.tthome.crm.models.dtos.ConsultStatusRequest;
import vn.tthome.crm.services.consultrequest.ConsultRequestService;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/crm/consult-requests")
@PreAuthorize("hasRole('ADMIN')")
public class ConsultRequestController {

	private final ConsultRequestService requests;

	public ConsultRequestController(ConsultRequestService requests) {
		this.requests = requests;
	}

	@GetMapping
	public PageResponse<ConsultRequestResponse> list(@RequestParam(required = false) @Size(max = 16) String status,
			@RequestParam(required = false) UUID assignedTo, @RequestParam(required = false) @Size(max = 100) String q,
			@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return requests.list(status, assignedTo, q, page, size);
	}

	@GetMapping("/{id}")
	public ConsultRequestResponse get(@PathVariable UUID id) {
		return requests.get(id);
	}

	@PutMapping("/{id}/assignee")
	public ConsultRequestResponse assign(@PathVariable UUID id, @RequestBody AssignRequest body) {
		return requests.assign(id, body.userId());
	}

	@PutMapping("/{id}/status")
	public ConsultRequestResponse setStatus(@PathVariable UUID id, @Valid @RequestBody ConsultStatusRequest body) {
		return requests.setStatus(id, body.status());
	}

}
