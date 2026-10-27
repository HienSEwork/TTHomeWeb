package vn.tthome.booking.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Moves an appointment on; cancelling needs a reason. Rescheduling has its own request because it needs a time. */
public record AppointmentStatusRequest(@NotNull @Pattern(regexp = "confirmed|completed|cancelled|no_show") String status,
		@Size(max = 500) String reason, @Size(max = 2000) String note) {
}
