package vn.tthome.report.repos.auditlog;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.report.models.dtos.AuditEntry;

/** Hand-written queries for the activity log; the inet column is handled in SQL, not mapped. */
public interface AuditLogRepositoryCustom {

	/** Appends a line. The ip is a literal address or null. */
	void record(UUID actorId, String ip, String action, String entityType, String entityId);

	/**
	 * One page of lines, newest first. Every filter is optional (null): actor and resource exactly, text as a
	 * case-insensitive substring of the action, the time within [from, to).
	 */
	Page<AuditEntry> search(UUID actorId, String entityType, String text, Instant from, Instant to, Pageable pageable);

}
