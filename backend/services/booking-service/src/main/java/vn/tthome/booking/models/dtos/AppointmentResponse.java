package vn.tthome.booking.models.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import vn.tthome.booking.models.entities.Appointment;

/** The history is filled in the detail view only; the list leaves it null. */
public record AppointmentResponse(UUID id, String code, UUID customerId, UUID userId, UUID projectId, UUID roomId,
		String mode, Instant scheduledAt, short durationMin, String status, UUID staffId, String contactName,
		String contactPhone, String note, String cancelReason, Instant createdAt, List<AppointmentHistoryResponse> history) {

	public static AppointmentResponse from(Appointment a) {
		return from(a, null);
	}

	public static AppointmentResponse from(Appointment a, List<AppointmentHistoryResponse> history) {
		return new AppointmentResponse(a.getId(), a.getCode(), a.getCustomerId(), a.getUserId(), a.getProjectId(),
				a.getRoomId(), a.getMode(), a.getScheduledAt(), a.getDurationMin(), a.getStatus(), a.getStaffId(),
				a.getContactName(), a.getContactPhone(), a.getNote(), a.getCancelReason(), a.getCreatedAt(), history);
	}

}
