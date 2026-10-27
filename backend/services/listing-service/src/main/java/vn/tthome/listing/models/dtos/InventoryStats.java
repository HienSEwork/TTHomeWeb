package vn.tthome.listing.models.dtos;

/** The rooms the company has, by status, and how many projects they sit in. */
public record InventoryStats(long projects, long rooms, long vacant, long reserved, long rented, long hidden) {
}
