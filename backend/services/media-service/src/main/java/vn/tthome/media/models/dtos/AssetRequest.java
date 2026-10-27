package vn.tthome.media.models.dtos;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** What Cloudinary answered after a signed upload; the browser reports it back to be registered. */
public record AssetRequest(@NotBlank @Size(max = 300) String publicId,
		@NotNull @Pattern(regexp = "image|video|raw") String resourceType, @Size(max = 20) String format,
		@PositiveOrZero Long bytes, @PositiveOrZero Integer width, @PositiveOrZero Integer height,
		@DecimalMin("0") BigDecimal durationSec, @PositiveOrZero Long version,
		@NotBlank @Size(max = 1000) String secureUrl, @Size(max = 200) String folder, @Size(max = 300) String altText) {
}
