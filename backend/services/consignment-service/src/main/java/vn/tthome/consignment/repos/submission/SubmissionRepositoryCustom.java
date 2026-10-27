package vn.tthome.consignment.repos.submission;

import java.time.Instant;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.consignment.models.entities.Submission;

/** Hand-written queries for submissions; methods are added when a task needs an optimized query. */
public interface SubmissionRepositoryCustom {

	/**
	 * One page of submissions, oldest first so the longest waiting ones come up first. Every filter is optional
	 * (null): status exactly, the time of submission within [from, to), text as a case-insensitive substring of the
	 * code, landlord name, landlord phone or address.
	 */
	Page<Submission> search(String status, Instant from, Instant to, String text, Pageable pageable);

}
