package vn.tthome.cms.models.dtos;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record BannerRequest(@NotNull @Pattern(regexp = "vi|en") String locale, @NotBlank @Size(max = 64) @Pattern(regexp = "[a-z0-9_]+") String placement, @Size(max = 200) String title, @NotBlank @Size(max = 1000) @Pattern(regexp = "https://\\S+") String imageUrl, @Size(max = 1000) @Pattern(regexp = "https://\\S+") String mobileImageUrl, @Size(max = 1000) @Pattern(regexp = "(/\\S*|https://\\S+)") String linkUrl, @NotNull @Min(0) @Max(32000) Short sortOrder, Instant startsAt, Instant endsAt, Boolean active) {
}
