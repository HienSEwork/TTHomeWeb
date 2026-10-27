package vn.tthome.booking.services.appointment.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.booking.models.dtos.AppointmentHistoryResponse;
import vn.tthome.booking.models.dtos.AppointmentNoteRequest;
import vn.tthome.booking.models.dtos.AppointmentRescheduleRequest;
import vn.tthome.booking.models.dtos.AppointmentResponse;
import vn.tthome.booking.models.dtos.AppointmentStatusRequest;
import vn.tthome.booking.models.entities.Appointment;
import vn.tthome.booking.models.entities.AppointmentHistory;
import vn.tthome.booking.repos.appointment.AppointmentRepository;
import vn.tthome.booking.repos.appointmenthistory.AppointmentHistoryRepository;
import vn.tthome.booking.services.appointment.AppointmentService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class AppointmentServiceImpl implements AppointmentService {

	private static final Set<String> OPEN = Set.of("pending", "confirmed", "rescheduled");
	private static final Map<String, Set<String>> MOVES = Map.of(
			"pending", Set.of("confirmed", "cancelled"),
			"confirmed", Set.of("completed", "cancelled", "no_show"),
			"rescheduled", Set.of("confirmed", "completed", "cancelled", "no_show"));
	private static final Set<String> AFTER_THE_VISIT = Set.of("completed", "no_show");

	private final AppointmentRepository appointments;
	private final AppointmentHistoryRepository history;
	private final Clock clock;

	public AppointmentServiceImpl(AppointmentRepository appointments, AppointmentHistoryRepository history, Clock clock) {
		this.appointments = appointments;
		this.history = history;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<AppointmentResponse> list(String status, UUID staffId, UUID projectId, Instant from, Instant to,
			String text, int page, int size) {
		return PageResponse.of(appointments.search(blank(status), staffId, projectId, from, to, blank(text),
				PageRequest.of(page, size)), AppointmentResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public AppointmentResponse get(UUID id) {
		Appointment appointment = find(id);
		List<AppointmentHistoryResponse> trail = history.findByAppointmentIdOrderByCreatedAtAsc(id).stream()
				.map(AppointmentHistoryResponse::from).toList();
		return AppointmentResponse.from(appointment, trail);
	}

	@Override
	@Transactional
	public AppointmentResponse assignStaff(UUID admin, UUID id, UUID staffId) {
		Appointment appointment = find(id);
		requireOpen(appointment);
		if (staffId != null && appointments.staffBusy(staffId, id, appointment.getScheduledAt(), end(appointment))) {
			throw conflict("The staff member has another appointment at this time");
		}
		appointment.setStaffId(staffId);
		appointments.saveAndFlush(appointment);
		record(id, appointment.getStatus(), appointment.getStatus(), admin, staffId == null ? "Staff removed" : "Staff assigned");
		return AppointmentResponse.from(appointment);
	}

	@Override
	@Transactional
	public AppointmentResponse setStatus(UUID admin, UUID id, AppointmentStatusRequest request) {
		Appointment appointment = find(id);
		String from = appointment.getStatus();
		String to = request.status();
		if (!MOVES.getOrDefault(from, Set.of()).contains(to)) {
			throw conflict("An appointment that is " + from + " cannot become " + to);
		}
		if (to.equals("cancelled") && (request.reason() == null || request.reason().isBlank())) {
			throw invalid("A cancellation needs a reason");
		}
		if (AFTER_THE_VISIT.contains(to) && appointment.getScheduledAt().isAfter(clock.instant())) {
			throw invalid("The visit has not happened yet");
		}
		appointment.setStatus(to);
		if (to.equals("cancelled")) {
			appointment.setCancelReason(request.reason().strip());
		}
		if (request.note() != null && !request.note().isBlank()) {
			appointment.setNote(request.note().strip());
		}
		appointments.saveAndFlush(appointment);
		record(id, from, to, admin, to.equals("cancelled") ? request.reason().strip() : strip(request.note()));
		return AppointmentResponse.from(appointment);
	}

	@Override
	@Transactional
	public AppointmentResponse reschedule(UUID admin, UUID id, AppointmentRescheduleRequest request) {
		Appointment appointment = find(id);
		requireOpen(appointment);
		if (!request.scheduledAt().isAfter(clock.instant())) {
			throw invalid("The new time must be in the future");
		}
		Instant end = request.scheduledAt().plus(Duration.ofMinutes(request.durationMin()));
		if (appointment.getStaffId() != null
				&& appointments.staffBusy(appointment.getStaffId(), id, request.scheduledAt(), end)) {
			throw conflict("The staff member has another appointment at this time");
		}
		String from = appointment.getStatus();
		appointment.setScheduledAt(request.scheduledAt());
		appointment.setDurationMin(request.durationMin());
		appointment.setStatus("rescheduled");
		appointments.saveAndFlush(appointment);
		record(id, from, "rescheduled", admin, strip(request.note()));
		return AppointmentResponse.from(appointment);
	}

	@Override
	@Transactional
	public AppointmentResponse setNote(UUID id, AppointmentNoteRequest request) {
		Appointment appointment = find(id);
		appointment.setNote(request.note() == null || request.note().isBlank() ? null : request.note().strip());
		appointments.saveAndFlush(appointment);
		return AppointmentResponse.from(appointment);
	}

	private void record(UUID appointmentId, String from, String to, UUID admin, String note) {
		AppointmentHistory row = new AppointmentHistory();
		row.setId(UUID.randomUUID());
		row.setAppointmentId(appointmentId);
		row.setFromStatus(from);
		row.setToStatus(to);
		row.setChangedBy(admin);
		row.setNote(note);
		history.saveAndFlush(row);
	}

	private static Instant end(Appointment appointment) {
		return appointment.getScheduledAt().plus(Duration.ofMinutes(appointment.getDurationMin()));
	}

	private static void requireOpen(Appointment appointment) {
		if (!OPEN.contains(appointment.getStatus())) {
			throw conflict("The appointment is " + appointment.getStatus());
		}
	}

	private Appointment find(UUID id) {
		return appointments.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Appointment not found"));
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String strip(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
