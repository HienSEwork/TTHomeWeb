package vn.tthome.listing.models.dtos;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;

/** A new status, a new price, or both; at least one is required. */
public record RoomAvailabilityRequest(@Pattern(regexp = "available|reserved|rented|hidden") String status,
		@PositiveOrZero Long price) {
}
