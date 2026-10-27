package vn.tthome.booking.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.booking.models.entities.AppointmentHistory;

public record AppointmentHistoryResponse(String fromStatus, String toStatus, UUID changedBy, String note, Instant createdAt) {

	public static AppointmentHistoryResponse from(AppointmentHistory h) {
		return new AppointmentHistoryResponse(h.getFromStatus(), h.getToStatus(), h.getChangedBy(), h.getNote(), h.getCreatedAt());
	}

}
