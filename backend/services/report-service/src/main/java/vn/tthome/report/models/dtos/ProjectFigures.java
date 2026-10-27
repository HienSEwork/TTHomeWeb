package vn.tthome.report.models.dtos;

import java.util.UUID;

/** What listing-service answers on /api/v1/admin/stats/projects. */
public record ProjectFigures(UUID id, String name, int totalRooms, int vacantCount, double occupancy, Long minPrice) {
}
