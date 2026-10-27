package vn.tthome.consignment.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.consignment.models.entities.ReviewLog;

public record ReviewLogResponse(String fromStatus, String toStatus, UUID reviewerId, String note, Instant createdAt) {

	public static ReviewLogResponse from(ReviewLog log) {
		return new ReviewLogResponse(log.getFromStatus(), log.getToStatus(), log.getReviewerId(), log.getNote(), log.getCreatedAt());
	}

}
