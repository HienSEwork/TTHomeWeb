package vn.tthome.identity.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record EmailVerifyRequest(
		@NotBlank @Size(max = 254) String email,
		@NotBlank @Pattern(regexp = "\\d{6}") String code,
		Boolean rememberMe) {

	public boolean remember() {
		return Boolean.TRUE.equals(rememberMe);
	}

}
