package vn.tthome.listing.models.dtos;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** The id is the official administrative code, so the caller supplies it. */
public record AdminUnitCreateRequest(@NotNull @Positive Integer id, Integer parentId,
		@NotNull @Min(1) @Max(3) Short level, @NotNull @Pattern(regexp = "pre_2025|post_2025") String scheme,
		@NotBlank @Size(max = 200) String name,
		@NotBlank @Size(max = 200) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String slug,
		@DecimalMin("-90") @DecimalMax("90") Double centerLat, @DecimalMin("-180") @DecimalMax("180") Double centerLng) {
}
