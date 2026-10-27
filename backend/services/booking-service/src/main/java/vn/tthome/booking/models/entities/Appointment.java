package vn.tthome.booking.models.entities;

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

/** A viewing appointment. Customers book it; the admin assigns staff, moves it along and keeps notes. */
@Entity
@Table(name = "appointment")
@Getter
@Setter
@NoArgsConstructor
public class Appointment {

	@Id
	private UUID id;

	@Column(nullable = false, updatable = false)
	private String code;

	@Column(name = "customer_id", nullable = false, updatable = false)
	private UUID customerId;

	@Column(name = "user_id", updatable = false)
	private UUID userId;

	@Column(name = "project_id", nullable = false, updatable = false)
	private UUID projectId;

	@Column(name = "room_id", updatable = false)
	private UUID roomId;

	@Column(nullable = false, updatable = false)
	private String mode;

	@Column(name = "scheduled_at", nullable = false)
	private Instant scheduledAt;

	@Column(name = "duration_min", nullable = false)
	private Short durationMin;

	@Column(nullable = false)
	private String status;

	@Column(name = "staff_id")
	private UUID staffId;

	@Column(name = "contact_name", updatable = false)
	private String contactName;

	@Column(name = "contact_phone", updatable = false)
	private String contactPhone;

	private String note;

	@Column(name = "cancel_reason")
	private String cancelReason;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

	@Version
	private Integer version;

}
