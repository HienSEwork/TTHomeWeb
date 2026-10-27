package vn.tthome.cms.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.cms.models.entities.PartnerApplication;

public record PartnerApplicationResponse(UUID id, String kind, String fullName, String phone, String email, String message,
		String position, String status, Instant createdAt) {

	public static PartnerApplicationResponse from(PartnerApplication a) {
		return new PartnerApplicationResponse(a.getId(), a.getKind(), a.getFullName(), a.getPhone(), a.getEmail(),
				a.getMessage(), a.getPosition(), a.getStatus(), a.getCreatedAt());
	}

}
