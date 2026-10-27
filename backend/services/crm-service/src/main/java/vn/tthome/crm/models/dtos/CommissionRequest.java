package vn.tthome.crm.models.dtos;

import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** The customer decides who is paid: the commission goes to the collaborator who referred them. */
public record CommissionRequest(@NotNull UUID customerId, @NotNull @PositiveOrZero Long amount, @Size(max = 1000) String note) {
}
