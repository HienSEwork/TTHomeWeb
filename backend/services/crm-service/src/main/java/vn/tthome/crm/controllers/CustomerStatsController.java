package vn.tthome.crm.controllers;

import java.time.Instant;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.tthome.crm.models.dtos.CustomerStats;
import vn.tthome.crm.services.stats.CustomerStatsService;

@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class CustomerStatsController {

	private final CustomerStatsService stats;

	public CustomerStatsController(CustomerStatsService stats) {
		this.stats = stats;
	}

	@GetMapping("/customers")
	public CustomerStats customers(
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
		return stats.customers(from, to);
	}

}
