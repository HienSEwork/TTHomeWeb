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

@Entity
@Table(name = "note")
@Getter
@Setter
@NoArgsConstructor
public class CustomerNote {

	@Id
	private UUID id;

	@Column(name = "author_id", nullable = false, updatable = false)
	private UUID authorId;

	@Column(name = "customer_id", updatable = false)
	private UUID customerId;

	@Column(nullable = false, updatable = false)
	private String body;

	@Column(name = "is_private", nullable = false, updatable = false)
	private boolean privateNote;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

}
