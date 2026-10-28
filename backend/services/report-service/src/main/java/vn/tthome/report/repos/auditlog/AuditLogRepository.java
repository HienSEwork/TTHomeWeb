package vn.tthome.report.repos.auditlog;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.report.models.entities.AuditLog;

public interface AuditLogRepository extends JpaRepository<AuditLog, UUID>, AuditLogRepositoryCustom {
}
