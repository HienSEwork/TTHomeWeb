package vn.tthome.report.controllers;

import java.time.Instant;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.report.models.dtos.AuditEntry;
import vn.tthome.report.models.dtos.AuditRecordRequest;
import vn.tthome.report.services.audit.AuditService;
import vn.tthome.common.security.AccessClaims;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
public class AuditLogController {

	private final AuditService audit;

	public AuditLogController(AuditService audit) {
		this.audit = audit;
	}

	@GetMapping
	public PageResponse<AuditEntry> list(@RequestParam(required = false) UUID actorId,
			@RequestParam(required = false) @Size(max = 200) String entityType, @RequestParam(required = false) @Size(max = 100) String q,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
			@RequestParam(defaultValue = "0") @Min(0) int page, @RequestParam(defaultValue = "50") @Min(1) @Max(200) int size) {
		return audit.list(actorId, entityType, q, from, to, page, size);
	}

	/** Called by the other services for every admin change, with the admin's own token. */
	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public void record(@AuthenticationPrincipal AccessClaims claims, @Valid @RequestBody AuditRecordRequest body) {
		audit.record(claims.userId(), body);
	}

}
