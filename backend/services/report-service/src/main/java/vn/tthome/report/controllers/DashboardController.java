package vn.tthome.report.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import vn.tthome.report.models.dtos.DashboardResponse;
import vn.tthome.report.services.dashboard.DashboardService;

@RestController
@RequestMapping("/api/v1/admin/dashboard")
@PreAuthorize("hasRole('ADMIN')")
public class DashboardController {

	private final DashboardService dashboard;

	public DashboardController(DashboardService dashboard) {
		this.dashboard = dashboard;
	}

	@GetMapping
	public DashboardResponse dashboard(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
			@RequestParam(defaultValue = "7") @Min(1) @Max(90) int days) {
		return dashboard.dashboard(authorization, days);
	}

}
