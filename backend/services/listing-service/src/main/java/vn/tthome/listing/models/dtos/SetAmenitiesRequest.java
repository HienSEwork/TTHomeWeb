package vn.tthome.listing.models.dtos;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The complete amenity set of a project or room; an empty list clears it. */
public record SetAmenitiesRequest(@NotNull @Size(max = 100) List<@NotNull Short> amenityIds) {
}
