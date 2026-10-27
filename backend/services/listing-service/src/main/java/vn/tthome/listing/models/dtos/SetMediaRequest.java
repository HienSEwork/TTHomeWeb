package vn.tthome.listing.models.dtos;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The complete gallery of a project or room; an empty list clears it. */
public record SetMediaRequest(@NotNull @Size(max = 100) List<@NotNull @Valid MediaLinkItem> items) {
}
