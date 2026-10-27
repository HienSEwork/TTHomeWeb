package vn.tthome.booking.services.appointment;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.booking.models.dtos.AppointmentNoteRequest;
import vn.tthome.booking.models.dtos.AppointmentRescheduleRequest;
import vn.tthome.booking.models.dtos.AppointmentResponse;
import vn.tthome.booking.models.dtos.AppointmentStatusRequest;
import vn.tthome.common.web.PageResponse;

/** Administration of viewing appointments: list, staff assignment, status changes and notes. */
public interface AppointmentService {

	/** One page of appointments, soonest first; blank filters are ignored. */
	PageResponse<AppointmentResponse> list(String status, UUID staffId, UUID projectId, Instant from, Instant to,
			String text, int page, int size);

	/** The appointment with its history. @throws vn.tthome.common.error.ApiException 404 NOT_FOUND. */
	AppointmentResponse get(UUID id);

	/**
	 * Assigns a staff member, or removes the assignment with null, and records it in the history.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT when the appointment is closed
	 *         (completed, cancelled or no show) or the staff member has an overlapping open appointment.
	 */
	AppointmentResponse assignStaff(UUID admin, UUID id, UUID staffId);

	/**
	 * Confirms, completes, cancels or marks a no show. Allowed moves: pending to confirmed or cancelled; confirmed to
	 * cancelled, completed or no show; rescheduled to confirmed, cancelled, completed or no show, where completed and no show are only possible once
	 * the visit time has passed. Cancelling needs a reason. Every move is recorded in the history.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a move that is not allowed, 400
	 *         VALIDATION_ERROR for a cancellation without a reason or completion before the visit time.
	 */
	AppointmentResponse setStatus(UUID admin, UUID id, AppointmentStatusRequest request);

	/**
	 * Moves the visit to another time and marks the appointment rescheduled. Allowed from pending, confirmed and
	 * rescheduled.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a closed appointment or a staff
	 *         member who is busy at the new time, 400 VALIDATION_ERROR for a time in the past.
	 */
	AppointmentResponse reschedule(UUID admin, UUID id, AppointmentRescheduleRequest request);

	/** Replaces the internal note. @throws vn.tthome.common.error.ApiException 404 NOT_FOUND. */
	AppointmentResponse setNote(UUID id, AppointmentNoteRequest request);

}
