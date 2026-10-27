package vn.tthome.booking.models.dtos;

import java.util.Map;

/**
 * Appointments created in a period by status, the open ones whose visit falls in the next seven days, and how
 * many are waiting for confirmation.
 */
public record AppointmentStats(long created, Map<String, Long> createdByStatus, long upcomingOpen, long pendingConfirmation) {
}
