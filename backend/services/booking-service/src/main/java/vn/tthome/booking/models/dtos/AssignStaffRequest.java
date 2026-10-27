package vn.tthome.booking.models.dtos;

import java.util.UUID;

/** The staff member who takes the visitor round; null removes the assignment. */
public record AssignStaffRequest(UUID staffId) {
}
