package vn.tthome.consignment.models.dtos;

import java.util.Map;

/** The submissions by status, and how many are waiting for the reviewer (status submitted). */
public record SubmissionStats(long total, Map<String, Long> byStatus, long pendingReview) {
}
