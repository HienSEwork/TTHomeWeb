package vn.tthome.booking.services.stats;

import java.time.Instant;

import vn.tthome.booking.models.dtos.AppointmentStats;

public interface AppointmentStatsService {

	/** from and to bound the period (default: the last 30 days); the period applies to the creation time. */
	AppointmentStats appointments(Instant from, Instant to);

}
