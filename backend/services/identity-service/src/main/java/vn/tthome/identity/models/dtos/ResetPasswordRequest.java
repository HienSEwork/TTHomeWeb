package vn.tthome.identity.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record ResetPasswordRequest(
		@NotBlank @Size(max = 254) String identifier,
		@NotBlank @Pattern(regexp = "\\d{6}") String code,
		@NotBlank @Size(min = 8, max = 128) String newPassword) {
}
