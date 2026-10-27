package vn.tthome.consignment.models.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "review_log")
@Getter
@Setter
@NoArgsConstructor
public class ReviewLog {

	@Id
	private UUID id;

	@Column(name = "submission_id", nullable = false, updatable = false)
	private UUID submissionId;

	@Column(name = "from_status", updatable = false)
	private String fromStatus;

	@Column(name = "to_status", nullable = false, updatable = false)
	private String toStatus;

	@Column(name = "reviewer_id", updatable = false)
	private UUID reviewerId;

	@Column(updatable = false)
	private String note;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

}
