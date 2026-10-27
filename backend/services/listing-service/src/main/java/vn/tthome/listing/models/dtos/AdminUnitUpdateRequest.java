package vn.tthome.listing.models.dtos;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Position, level and scheme of a unit never change; only its naming and map centre do. */
public record AdminUnitUpdateRequest(@NotBlank @Size(max = 200) String name,
		@NotBlank @Size(max = 200) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String slug,
		@DecimalMin("-90") @DecimalMax("90") Double centerLat, @DecimalMin("-180") @DecimalMax("180") Double centerLng) {
}
