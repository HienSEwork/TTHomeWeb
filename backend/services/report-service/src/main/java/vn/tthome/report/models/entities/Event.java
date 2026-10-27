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

/** One tracked visitor action. Events arrive from the web site; the admin reports only read them. */
@Entity
@Immutable
@Table(name = "event")
@Getter
@NoArgsConstructor
public class Event {

	@Id
	private UUID id;

	@Column(nullable = false)
	private String name;

	@Column(name = "session_id")
	private String sessionId;

	@Column(name = "created_at")
	private Instant createdAt;

}
