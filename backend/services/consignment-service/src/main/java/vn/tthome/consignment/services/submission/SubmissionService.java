package vn.tthome.consignment.services.submission;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.consignment.models.dtos.ReviewRequest;
import vn.tthome.consignment.models.dtos.SubmissionResponse;
import vn.tthome.common.web.PageResponse;

/** Review of the rooms that landlords offer for listing. */
public interface SubmissionService {

	/** One page of submissions, oldest first; blank filters are ignored. */
	PageResponse<SubmissionResponse> list(String status, Instant from, Instant to, String text, int page, int size);

	/** The submission with its review log. @throws vn.tthome.common.error.ApiException 404 NOT_FOUND. */
	SubmissionResponse get(UUID id);

	/**
	 * Records the reviewer's decision. A submitted request, or one waiting for information, can be approved,
	 * rejected or sent back for more information; anything else is final. The decision is written into the review
	 * log with the reviewer and the note.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT when the submission is no longer open
	 *         for review, 400 VALIDATION_ERROR when rejecting or asking for information without a note.
	 */
	SubmissionResponse review(UUID reviewer, UUID id, ReviewRequest request);

}
