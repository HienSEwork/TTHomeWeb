package vn.tthome.booking.models.dtos;

import jakarta.validation.constraints.Size;

/** Replaces the internal note; null or blank clears it. */
public record AppointmentNoteRequest(@Size(max = 2000) String note) {
}
