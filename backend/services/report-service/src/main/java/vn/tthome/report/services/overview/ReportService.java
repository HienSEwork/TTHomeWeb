package vn.tthome.report.services.overview;

import java.time.Instant;

import vn.tthome.report.models.dtos.ReportOverview;

/** The report an admin reads to see how the business is doing over a period. */
public interface ReportService {

	/**
	 * Puts together the traffic of the web site with the bookings, customers and rooms reported by the other
	 * services. The period defaults to the last 30 days and may not exceed 366 days.
	 *
	 * @param authorization the caller's bearer token, passed on to the services
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for a period that ends before it starts or is
	 *         longer than 366 days.
	 */
	ReportOverview overview(String authorization, Instant from, Instant to);

}
