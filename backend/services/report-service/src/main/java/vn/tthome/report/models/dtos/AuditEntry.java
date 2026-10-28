package vn.tthome.report.models.dtos;

import java.time.Instant;
import java.util.UUID;

public record AuditEntry(UUID id, UUID actorId, String actorIp, String action, String entityType, String entityId, Instant createdAt) {
}
