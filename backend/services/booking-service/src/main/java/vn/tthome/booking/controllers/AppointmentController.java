package vn.tthome.booking.controllers;

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
import vn.tthome.booking.models.dtos.AppointmentNoteRequest;
import vn.tthome.booking.models.dtos.AppointmentRescheduleRequest;
import vn.tthome.booking.models.dtos.AppointmentResponse;
import vn.tthome.booking.models.dtos.AppointmentStatusRequest;
import vn.tthome.booking.models.dtos.AssignStaffRequest;
import vn.tthome.booking.services.appointment.AppointmentService;
import vn.tthome.common.security.AccessClaims;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/booking/appointments")
@PreAuthorize("hasRole('ADMIN')")
public class AppointmentController {

	private final AppointmentService appointments;

	public AppointmentController(AppointmentService appointments) {
		this.appointments = appointments;
	}

	@GetMapping
	public PageResponse<AppointmentResponse> list(@RequestParam(required = false) @Size(max = 16) String status,
			@RequestParam(required = false) UUID staffId, @RequestParam(required = false) UUID projectId,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to,
			@RequestParam(required = false) @Size(max = 100) String q, @RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return appointments.list(status, staffId, projectId, from, to, q, page, size);
	}

	@GetMapping("/{id}")
	public AppointmentResponse get(@PathVariable UUID id) {
		return appointments.get(id);
	}

	@PutMapping("/{id}/staff")
	public AppointmentResponse assignStaff(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@RequestBody AssignStaffRequest body) {
		return appointments.assignStaff(claims.userId(), id, body.staffId());
	}

	@PutMapping("/{id}/status")
	public AppointmentResponse setStatus(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@Valid @RequestBody AppointmentStatusRequest body) {
		return appointments.setStatus(claims.userId(), id, body);
	}

	@PutMapping("/{id}/reschedule")
	public AppointmentResponse reschedule(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@Valid @RequestBody AppointmentRescheduleRequest body) {
		return appointments.reschedule(claims.userId(), id, body);
	}

	@PutMapping("/{id}/note")
	public AppointmentResponse setNote(@PathVariable UUID id, @Valid @RequestBody AppointmentNoteRequest body) {
		return appointments.setNote(id, body);
	}

}
