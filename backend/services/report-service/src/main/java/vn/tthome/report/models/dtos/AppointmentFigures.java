package vn.tthome.report.models.dtos;

import java.util.Map;

/** What booking-service answers on /api/v1/admin/stats/appointments. */
public record AppointmentFigures(long created, Map<String, Long> createdByStatus, long upcomingOpen, long pendingConfirmation) {
}
