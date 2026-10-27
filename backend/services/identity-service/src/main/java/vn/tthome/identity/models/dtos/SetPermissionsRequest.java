package vn.tthome.identity.models.dtos;

import java.util.List;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** The complete permission set of a role; an empty list revokes all of them. */
public record SetPermissionsRequest(@NotNull @Size(max = 100) List<@NotBlank @Size(max = 64) String> permissions) {
}
