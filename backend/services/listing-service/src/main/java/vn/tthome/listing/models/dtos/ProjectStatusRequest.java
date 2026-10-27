package vn.tthome.listing.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ProjectStatusRequest(@NotNull @Pattern(regexp = "active|hidden|closed") String status) {
}
