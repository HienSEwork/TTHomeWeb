package vn.tthome.booking.models.entities;

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
@Table(name = "appointment_history")
@Getter
@Setter
@NoArgsConstructor
public class AppointmentHistory {

	@Id
	private UUID id;

	@Column(name = "appointment_id", nullable = false, updatable = false)
	private UUID appointmentId;

	@Column(name = "from_status", updatable = false)
	private String fromStatus;

	@Column(name = "to_status", nullable = false, updatable = false)
	private String toStatus;

	@Column(name = "changed_by", updatable = false)
	private UUID changedBy;

	@Column(updatable = false)
	private String note;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

}
