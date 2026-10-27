package vn.tthome.crm.models.dtos;

import java.util.UUID;

/** The staff member who looks after a customer or a consultation request; null removes the assignment. */
public record AssignRequest(UUID userId) {
}
