package vn.tthome.cms.controllers;

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
import vn.tthome.cms.models.dtos.PartnerApplicationResponse;
import vn.tthome.cms.models.dtos.PartnerApplicationStatusRequest;
import vn.tthome.cms.services.partnerapplication.PartnerApplicationService;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/cms/partner-applications")
@PreAuthorize("hasRole('ADMIN')")
public class PartnerApplicationController {

	private final PartnerApplicationService applications;

	public PartnerApplicationController(PartnerApplicationService applications) {
		this.applications = applications;
	}

	@GetMapping
	public PageResponse<PartnerApplicationResponse> list(@RequestParam(required = false) @Size(max = 8) String kind,
			@RequestParam(required = false) @Size(max = 16) String status, @RequestParam(required = false) @Size(max = 100) String q,
			@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return applications.list(kind, status, q, page, size);
	}

	@GetMapping("/{id}")
	public PartnerApplicationResponse get(@PathVariable UUID id) {
		return applications.get(id);
	}

	@PutMapping("/{id}/status")
	public PartnerApplicationResponse setStatus(@PathVariable UUID id, @Valid @RequestBody PartnerApplicationStatusRequest body) {
		return applications.setStatus(id, body.status());
	}

}
