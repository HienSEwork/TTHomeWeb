package vn.tthome.crm.models.dtos;

import java.util.UUID;

/**
 * What one collaborator has brought in: the customers they referred, how many rented, the commission still owed
 * (pending or approved) and the commission already paid.
 */
public record CollaboratorSummary(UUID referrerUserId, long customers, long rented, long commissionOwed, long commissionPaid) {
}
