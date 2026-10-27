package vn.tthome.report.clients;

import java.time.Instant;
import java.util.Optional;

import vn.tthome.report.models.dtos.AppointmentFigures;
import vn.tthome.report.models.dtos.CustomerFigures;
import vn.tthome.report.models.dtos.InventoryFigures;
import vn.tthome.report.models.dtos.SubmissionFigures;

/**
 * Reads the statistics endpoints of the services that own the figures, on behalf of the admin whose bearer token is
 * passed along. A service that fails, answers an error or is too slow gives an empty result instead of an exception:
 * one service being down must not take the dashboard down.
 */
public interface StatsClient {

	Optional<InventoryFigures> inventory(String authorization);

	Optional<AppointmentFigures> appointments(String authorization, Instant from, Instant to);

	Optional<CustomerFigures> customers(String authorization, Instant from, Instant to);

	Optional<SubmissionFigures> submissions(String authorization);

	/** The busiest projects with their occupancy; at most size (50). */
	Optional<java.util.List<vn.tthome.report.models.dtos.ProjectFigures>> projects(String authorization, int size);

}
