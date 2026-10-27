package vn.tthome.crm.models.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One step of the care history; the table is partitioned by month, so rows are only ever added. */
@Entity
@Table(name = "interaction")
@Getter
@Setter
@NoArgsConstructor
public class Interaction {

	@Id
	private UUID id;

	@Column(name = "customer_id", nullable = false, updatable = false)
	private UUID customerId;

	@Column(nullable = false, updatable = false)
	private String kind;

	@Column(updatable = false)
	private String direction;

	@Column(updatable = false)
	private String summary;

	@Column(name = "actor_id", updatable = false)
	private UUID actorId;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

}
