package vn.tthome.report.models.dtos;

import java.time.Instant;
import java.util.List;

/**
 * The numbers an admin wants first. A figure is null when the service that owns it did not answer in time; its name
 * is then listed in unavailable, so a missing number is never mistaken for zero.
 */
public record DashboardResponse(Instant from, Instant to, Long vacantRooms, Long totalRooms, Long upcomingAppointments,
		Long appointmentsToConfirm, Long newCustomers, Long newConsultRequests, Long pendingConsignments,
		List<String> unavailable) {
}
