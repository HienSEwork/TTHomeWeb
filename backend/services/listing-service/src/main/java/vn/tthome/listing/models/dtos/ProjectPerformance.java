package vn.tthome.listing.models.dtos;

import java.util.UUID;

/** How full a project is: the share of its rooms that are not vacant, with its lowest asking price. */
public record ProjectPerformance(UUID id, String name, int totalRooms, int vacantCount, double occupancy, Long minPrice) {
}
