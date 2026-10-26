package vn.tthome.identity.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record LoginRequest(
		@NotBlank @Size(max = 254) String identifier,
		@NotBlank @Size(max = 128) String password,
		Boolean rememberMe) {

	public boolean remember() {
		return Boolean.TRUE.equals(rememberMe);
	}

}
