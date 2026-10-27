package vn.tthome.report.repos.event;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import vn.tthome.report.models.dtos.DayCount;

/** Hand-written queries for tracked events; methods are added when a task needs an optimized query. */
public interface EventRepositoryCustom {

	/** The distinct sessions that did anything within [from, to). */
	long visitors(Instant from, Instant to);

	/** The events within [from, to) counted by name. */
	Map<String, Long> countByName(Instant from, Instant to);

	/** The "view" events within [from, to) counted per UTC day, oldest first; days without views are left out. */
	List<DayCount> viewsByDay(Instant from, Instant to);

}
