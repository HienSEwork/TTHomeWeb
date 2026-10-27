package vn.tthome.crm.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.crm.models.entities.Commission;

public record CommissionResponse(UUID id, UUID customerId, UUID referrerUserId, long amount, String status, String note,
		UUID createdBy, Instant paidAt, Instant createdAt) {

	public static CommissionResponse from(Commission c) {
		return new CommissionResponse(c.getId(), c.getCustomerId(), c.getReferrerUserId(), c.getAmount().longValueExact(),
				c.getStatus(), c.getNote(), c.getCreatedBy(), c.getPaidAt(), c.getCreatedAt());
	}

}
