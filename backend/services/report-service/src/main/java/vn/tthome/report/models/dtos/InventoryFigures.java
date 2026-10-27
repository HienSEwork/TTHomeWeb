package vn.tthome.report.models.dtos;

/** What listing-service answers on /api/v1/admin/stats/inventory. */
public record InventoryFigures(long projects, long rooms, long vacant, long reserved, long rented, long hidden) {
}
