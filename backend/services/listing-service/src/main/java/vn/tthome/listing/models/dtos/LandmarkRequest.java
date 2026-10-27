package vn.tthome.listing.models.dtos;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record LandmarkRequest(@NotBlank @Size(max = 64) @Pattern(regexp = "[a-z0-9]+(_[a-z0-9]+)*") String code,
		@NotBlank @Size(max = 200) String name,
		@NotNull @Pattern(regexp = "university|mall|industrial|hospital|other") String kind,
		@DecimalMin("-90") @DecimalMax("90") Double lat, @DecimalMin("-180") @DecimalMax("180") Double lng,
		@NotNull @Min(1) @Max(100000) Integer radiusM, @NotNull @Min(0) @Max(32000) Short sortOrder) {
}
