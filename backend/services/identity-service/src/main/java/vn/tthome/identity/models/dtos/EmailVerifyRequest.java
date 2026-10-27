package vn.tthome.identity.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmailVerifyRequest(
		@NotBlank @Size(max = 254) String email,
		@NotBlank @Pattern(regexp = "\\d{6}") String code,
		@Size(max = 100) String fullName,
		@NotBlank @Size(min = 8, max = 128) String password,
		Boolean rememberMe) {

	public boolean remember() {
		return Boolean.TRUE.equals(rememberMe);
	}

}
