package vn.tthome.common.audit;

/**
 * What an admin did, as reported to the audit log. The action is the HTTP method and the route pattern, for example
 * "PUT /api/v1/admin/cms/posts/{id}/status"; the entity is the resource of the route and the first id in its path.
 */
public record AuditEvent(String action, String entityType, String entityId, String ip) {
}
