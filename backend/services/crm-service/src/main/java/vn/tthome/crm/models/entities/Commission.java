package vn.tthome.crm.models.entities;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** What is owed to a collaborator for a customer they referred, and how far its payment has got. */
@Entity
@Table(name = "commission")
@Getter
@Setter
@NoArgsConstructor
public class Commission {

	@Id
	private UUID id;

	@Column(name = "customer_id", nullable = false, updatable = false)
	private UUID customerId;

	@Column(name = "referrer_user_id", nullable = false, updatable = false)
	private UUID referrerUserId;

	@Column(nullable = false)
	private BigDecimal amount;

	@Column(nullable = false)
	private String status = "pending";

	private String note;

	@Column(name = "created_by", updatable = false)
	private UUID createdBy;

	@Column(name = "paid_at")
	private Instant paidAt;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

}
