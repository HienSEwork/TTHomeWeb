package vn.tthome.consignment.services.submission.impl;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.consignment.models.dtos.ReviewLogResponse;
import vn.tthome.consignment.models.dtos.ReviewRequest;
import vn.tthome.consignment.models.dtos.SubmissionResponse;
import vn.tthome.consignment.models.entities.ReviewLog;
import vn.tthome.consignment.models.entities.Submission;
import vn.tthome.consignment.repos.reviewlog.ReviewLogRepository;
import vn.tthome.consignment.repos.submission.SubmissionRepository;
import vn.tthome.consignment.services.submission.SubmissionService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class SubmissionServiceImpl implements SubmissionService {

	private static final Set<String> OPEN_FOR_REVIEW = Set.of("submitted", "need_info");
	private static final Map<String, String> RESULT = Map.of("approve", "approved", "reject", "rejected", "need_info", "need_info");

	private final SubmissionRepository submissions;
	private final ReviewLogRepository log;

	public SubmissionServiceImpl(SubmissionRepository submissions, ReviewLogRepository log) {
		this.submissions = submissions;
		this.log = log;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<SubmissionResponse> list(String status, Instant from, Instant to, String text, int page, int size) {
		return PageResponse.of(submissions.search(blank(status), from, to, blank(text), PageRequest.of(page, size)),
				SubmissionResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public SubmissionResponse get(UUID id) {
		Submission submission = find(id);
		List<ReviewLogResponse> trail = log.findBySubmissionIdOrderByCreatedAtAsc(id).stream().map(ReviewLogResponse::from).toList();
		return SubmissionResponse.from(submission, trail);
	}

	@Override
	@Transactional
	public SubmissionResponse review(UUID reviewer, UUID id, ReviewRequest request) {
		Submission submission = find(id);
		if (!OPEN_FOR_REVIEW.contains(submission.getStatus())) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The submission is " + submission.getStatus());
		}
		String note = request.note() == null || request.note().isBlank() ? null : request.note().strip();
		String decision = request.decision();
		if (!decision.equals("approve") && note == null) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
					decision.equals("reject") ? "Rejecting needs a reason" : "Say what information is missing");
		}
		String from = submission.getStatus();
		String to = RESULT.get(decision);
		submission.setStatus(to);
		submission.setReviewerId(reviewer);
		submission.setRejectReason(decision.equals("reject") ? note : null);
		submissions.saveAndFlush(submission);
		ReviewLog row = new ReviewLog();
		row.setId(UUID.randomUUID());
		row.setSubmissionId(id);
		row.setFromStatus(from);
		row.setToStatus(to);
		row.setReviewerId(reviewer);
		row.setNote(note);
		log.saveAndFlush(row);
		return SubmissionResponse.from(submission);
	}

	private Submission find(UUID id) {
		return submissions.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Submission not found"));
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
