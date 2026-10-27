package vn.tthome.report.models.dtos;

import java.util.Map;

/** What consignment-service answers on /api/v1/admin/stats/submissions. */
public record SubmissionFigures(long total, Map<String, Long> byStatus, long pendingReview) {
}
