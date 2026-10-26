package vn.tthome.identity.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import vn.tthome.identity.models.enums.ContactType;

public record ConfirmContactRequest(
		@NotNull ContactType type,
		@NotBlank @Size(max = 254) String newValue,
		@NotBlank @Pattern(regexp = "\\d{6}") String code) {
}
