package vn.tthome.consignment.controllers;

import java.time.Instant;
import java.util.UUID;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
import vn.tthome.consignment.models.dtos.ReviewRequest;
import vn.tthome.consignment.models.dtos.SubmissionResponse;
import vn.tthome.consignment.services.submission.SubmissionService;
import vn.tthome.common.security.AccessClaims;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/consignment/submissions")
@PreAuthorize("hasRole('ADMIN')")
public class SubmissionController {

	private final SubmissionService submissions;

	public SubmissionController(SubmissionService submissions) {
		this.submissions = submissions;
	}

	@GetMapping
	public PageResponse<SubmissionResponse> list(@RequestParam(required = false) @Size(max = 16) String status,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
			@RequestParam(required = false) @Size(max = 100) String q, @RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return submissions.list(status, from, to, q, page, size);
	}

	@GetMapping("/{id}")
	public SubmissionResponse get(@PathVariable UUID id) {
		return submissions.get(id);
	}

	@PutMapping("/{id}/review")
	public SubmissionResponse review(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@Valid @RequestBody ReviewRequest body) {
		return submissions.review(claims.userId(), id, body);
	}

}
