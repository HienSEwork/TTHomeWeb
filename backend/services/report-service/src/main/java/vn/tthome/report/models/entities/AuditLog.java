package vn.tthome.report.models.entities;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One line of the activity log. The table is partitioned by month and rows are only ever added. */
@Entity
@Immutable
@Table(name = "audit_log")
@Getter
@NoArgsConstructor
public class AuditLog {

	@Id
	private UUID id;

	@Column(name = "actor_id")
	private UUID actorId;

	@Column(nullable = false)
	private String action;

	@Column(name = "created_at")
	private Instant createdAt;

}
