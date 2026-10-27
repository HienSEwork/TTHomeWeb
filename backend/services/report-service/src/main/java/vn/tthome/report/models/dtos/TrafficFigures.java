package vn.tthome.report.models.dtos;

import java.util.List;
import java.util.Map;

/** Visits to the site: distinct visitor sessions, page views ("view" events), views per day and every event by name. */
public record TrafficFigures(long visitors, long views, List<DayCount> viewsByDay, Map<String, Long> eventsByName) {
}
