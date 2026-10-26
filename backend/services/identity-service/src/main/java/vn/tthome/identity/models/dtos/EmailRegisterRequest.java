package vn.tthome.identity.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record EmailRegisterRequest(
		@NotBlank @Size(max = 254) String email,
		@NotBlank @Size(min = 8, max = 128) String password,
		@Size(max = 100) String fullName) {
}
