package vn.tthome.crm.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.crm.models.entities.Customer;

public record CustomerResponse(UUID id, UUID userId, String fullName, String phone, String email, String zalo,
		String source, String stage, String lostReason, UUID ownerUserId, UUID referrerUserId, short priority,
		Instant lastContactAt, Instant nextFollowupAt, Instant createdAt) {

	public static CustomerResponse from(Customer c) {
		return new CustomerResponse(c.getId(), c.getUserId(), c.getFullName(), c.getPhone(), c.getEmail(), c.getZalo(),
				c.getSource(), c.getStage(), c.getLostReason(), c.getOwnerUserId(), c.getReferrerUserId(), c.getPriority(),
				c.getLastContactAt(), c.getNextFollowupAt(), c.getCreatedAt());
	}

}
