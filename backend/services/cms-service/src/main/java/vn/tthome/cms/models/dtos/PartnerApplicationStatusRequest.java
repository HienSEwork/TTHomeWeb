package vn.tthome.cms.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record PartnerApplicationStatusRequest(@NotNull @Pattern(regexp = "contacted|approved|rejected") String status) {
}
