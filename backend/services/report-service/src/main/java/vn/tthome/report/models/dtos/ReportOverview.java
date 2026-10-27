package vn.tthome.report.models.dtos;

import java.time.Instant;
import java.util.List;

/**
 * The figures of a period: traffic (this service), bookings, customers and rooms (the services that own them). A
 * part is null when its service did not answer, and its name is then listed in unavailable. The booking rate is the
 * appointments created divided by the visitors, null when either is missing or there were no visitors.
 */
public record ReportOverview(Instant from, Instant to, TrafficFigures traffic, AppointmentFigures appointments,
		Double bookingRate, CustomerFigures customers, InventoryFigures inventory, List<ProjectFigures> projects,
		List<String> unavailable) {
}
