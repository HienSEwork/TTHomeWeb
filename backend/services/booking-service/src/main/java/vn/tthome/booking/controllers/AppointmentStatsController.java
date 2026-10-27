package vn.tthome.booking.controllers;

import java.time.Instant;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.tthome.booking.models.dtos.AppointmentStats;
import vn.tthome.booking.services.stats.AppointmentStatsService;

@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
public class AppointmentStatsController {

	private final AppointmentStatsService stats;

	public AppointmentStatsController(AppointmentStatsService stats) {
		this.stats = stats;
	}

	@GetMapping("/appointments")
	public AppointmentStats appointments(
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
		return stats.appointments(from, to);
	}

}
