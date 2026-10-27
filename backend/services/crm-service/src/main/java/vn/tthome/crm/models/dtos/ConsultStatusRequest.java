package vn.tthome.crm.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

public record ConsultStatusRequest(@NotNull @Pattern(regexp = "contacted|done|spam") String status) {
}
