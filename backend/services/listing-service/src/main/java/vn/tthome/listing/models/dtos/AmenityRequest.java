package vn.tthome.listing.models.dtos;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record AmenityRequest(@NotBlank @Size(max = 64) @Pattern(regexp = "[a-z0-9]+(_[a-z0-9]+)*") String code,
		@NotBlank @Size(max = 200) String name, @NotNull @Pattern(regexp = "room|project|both") String scope,
		@Size(max = 100) String icon, @NotNull @Min(0) @Max(32000) Short sortOrder, @NotNull Boolean filter) {
}
