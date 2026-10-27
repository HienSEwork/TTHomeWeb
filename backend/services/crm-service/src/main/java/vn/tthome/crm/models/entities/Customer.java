package vn.tthome.crm.models.entities;

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

@Entity
@Table(name = "customer")
@Getter
@Setter
@NoArgsConstructor
public class Customer {

	@Id
	private UUID id;

	@Column(name = "user_id", updatable = false)
	private UUID userId;

	@Column(name = "full_name")
	private String fullName;

	private String phone;

	private String email;

	private String zalo;

	@Column(nullable = false)
	private String source = "web";

	@Column(nullable = false)
	private String stage = "new";

	@Column(name = "lost_reason")
	private String lostReason;

	@Column(name = "owner_user_id")
	private UUID ownerUserId;

	@Column(name = "referrer_user_id")
	private UUID referrerUserId;

	@Column(nullable = false)
	private Short priority = 0;

	@Column(name = "last_contact_at")
	private Instant lastContactAt;

	@Column(name = "next_followup_at")
	private Instant nextFollowupAt;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Version
	private Integer version;

}
