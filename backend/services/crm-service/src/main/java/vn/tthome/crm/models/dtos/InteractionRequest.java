package vn.tthome.crm.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** A contact with the customer. Stage changes and system events are written by the service itself. */
public record InteractionRequest(@NotNull @Pattern(regexp = "call|meeting|zalo|sms|email|chat") String kind,
		@Pattern(regexp = "in|out") String direction, @NotBlank @Size(max = 2000) String summary) {
}
