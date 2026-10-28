package vn.tthome.report.services.audit;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.report.models.dtos.AuditEntry;
import vn.tthome.report.models.dtos.AuditRecordRequest;
import vn.tthome.common.web.PageResponse;

/** The activity log: what staff and admins changed, by whom, from where and when. */
public interface AuditService {

	/**
	 * Adds a line for the actor. An address that is not a valid IP literal is stored as unknown rather than refused:
	 * a malformed header must not lose the line.
	 */
	void record(UUID actorId, AuditRecordRequest request);

	/** One page of lines, newest first; blank filters are ignored. */
	PageResponse<AuditEntry> list(UUID actorId, String entityType, String text, Instant from, Instant to, int page, int size);

}
