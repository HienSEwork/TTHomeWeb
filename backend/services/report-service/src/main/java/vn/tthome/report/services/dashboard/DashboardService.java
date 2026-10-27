package vn.tthome.report.services.dashboard;

import vn.tthome.report.models.dtos.DashboardResponse;

/** The overview an admin sees first. */
public interface DashboardService {

	/**
	 * Asks the services that own the figures, in parallel, and puts the answers together. The new customers and
	 * consultation requests cover the last given days; the other figures are current.
	 *
	 * @param authorization the caller's bearer token, passed on to the services
	 */
	DashboardResponse dashboard(String authorization, int days);

}
