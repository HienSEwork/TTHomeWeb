package vn.tthome.media.models.dtos;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** The folder is a path such as tthome/projects/PRJ-abc; the resource type decides the upload endpoint. */
public record UploadSignatureRequest(
		@NotNull @Size(max = 200) @Pattern(regexp = "[A-Za-z0-9_-]+(/[A-Za-z0-9_-]+)*") String folder,
		@NotNull @Pattern(regexp = "image|video") String resourceType) {
}
