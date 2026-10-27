package vn.tthome.listing.models.dtos;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** One asset of an ordered gallery; the position in the list is its sort order. */
public record MediaLinkItem(@NotNull UUID assetId, @NotNull @Pattern(regexp = "photo|video|floorplan|360") String kind,
		Boolean cover) {
}
