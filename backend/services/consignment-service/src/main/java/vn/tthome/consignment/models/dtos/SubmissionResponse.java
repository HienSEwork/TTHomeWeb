package vn.tthome.consignment.models.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import vn.tthome.consignment.models.entities.Submission;

/** The review log is filled in the detail view only. Rooms is the landlord's own JSON, passed on as it was sent. */
public record SubmissionResponse(UUID id, String code, UUID landlordId, String landlordName, String landlordPhone,
		String projectName, String addressText, Integer wardId, Integer roomCount, String roomsJson, Long expectedPriceMin,
		Long expectedPriceMax, String note, String status, UUID reviewerId, String rejectReason, Instant createdAt,
		List<ReviewLogResponse> reviewLog) {

	public static SubmissionResponse from(Submission s) {
		return from(s, null);
	}

	public static SubmissionResponse from(Submission s, List<ReviewLogResponse> reviewLog) {
		return new SubmissionResponse(s.getId(), s.getCode(), s.getLandlordId(), s.getLandlordName(), s.getLandlordPhone(),
				s.getProjectName(), s.getAddressText(), s.getWardId(), s.getRoomCount(), s.getRooms(),
				s.getExpectedPriceMin() == null ? null : s.getExpectedPriceMin().longValueExact(),
				s.getExpectedPriceMax() == null ? null : s.getExpectedPriceMax().longValueExact(), s.getNote(), s.getStatus(),
				s.getReviewerId(), s.getRejectReason(), s.getCreatedAt(), reviewLog);
	}

}
