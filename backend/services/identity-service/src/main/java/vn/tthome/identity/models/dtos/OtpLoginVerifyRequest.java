package vn.tthome.identity.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record OtpLoginVerifyRequest(
		@NotBlank @Size(max = 32) String phone,
		@NotBlank @Pattern(regexp = "\\d{6}") String code,
		Boolean rememberMe) {

	public boolean remember() {
		return Boolean.TRUE.equals(rememberMe);
	}

}
