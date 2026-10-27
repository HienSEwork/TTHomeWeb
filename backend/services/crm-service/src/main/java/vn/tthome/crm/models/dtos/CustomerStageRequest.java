package vn.tthome.crm.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** Moves a customer along the pipeline; "lost" needs a reason, any other stage drops it. */
public record CustomerStageRequest(@NotNull @Pattern(regexp = "new|contacted|viewing|deposited|rented|lost") String stage,
		@Size(max = 500) String lostReason) {
}
