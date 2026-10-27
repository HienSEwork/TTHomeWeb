package vn.tthome.crm.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** A note on a customer; a private note is seen by its author only. */
public record NoteRequest(@NotBlank @Size(max = 5000) String body, Boolean privateNote) {
}
