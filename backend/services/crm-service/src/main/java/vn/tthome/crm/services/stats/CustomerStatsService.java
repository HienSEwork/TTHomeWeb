package vn.tthome.crm.services.stats;

import java.time.Instant;

import vn.tthome.crm.models.dtos.CustomerStats;

public interface CustomerStatsService {

	/** from and to bound the period (default: the last 30 days); the period applies to the creation time. */
	CustomerStats customers(Instant from, Instant to);

}
