package vn.tthome.consignment.controllers;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import vn.tthome.consignment.models.dtos.SubmissionStats;
import vn.tthome.consignment.services.stats.SubmissionStatsService;

@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class SubmissionStatsController {

	private final SubmissionStatsService stats;

	public SubmissionStatsController(SubmissionStatsService stats) {
		this.stats = stats;
	}

	@GetMapping("/submissions")
	public SubmissionStats submissions() {
		return stats.submissions();
	}

}
