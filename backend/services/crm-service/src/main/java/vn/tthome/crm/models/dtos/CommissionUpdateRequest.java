package vn.tthome.crm.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CommissionUpdateRequest(@NotNull @PositiveOrZero Long amount, @Size(max = 1000) String note) {
}
