package vn.tthome.crm.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record CommissionStatusRequest(@NotNull @Pattern(regexp = "approved|paid|cancelled") String status) {
}
