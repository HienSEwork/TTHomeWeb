package vn.tthome.identity.models.dtos;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

public record SetRolesRequest(@NotEmpty @Size(max = 10) List<@NotBlank @Size(max = 32) String> roles) {
}
