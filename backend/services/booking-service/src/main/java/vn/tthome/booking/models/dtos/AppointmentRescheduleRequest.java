package vn.tthome.booking.models.dtos;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AppointmentRescheduleRequest(@NotNull Instant scheduledAt, @NotNull @Min(5) @Max(480) Short durationMin,
		@Size(max = 2000) String note) {
}
