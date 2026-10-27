package vn.tthome.listing.services.stats;

import java.util.List;

import vn.tthome.listing.models.dtos.InventoryStats;
import vn.tthome.listing.models.dtos.ProjectPerformance;

/** Figures for the dashboard and the reports. */
public interface InventoryStatsService {

	InventoryStats inventory();

	/** The projects with the most rooms first, each with its occupancy. size is at most 50. */
	List<ProjectPerformance> projects(int size);

}
