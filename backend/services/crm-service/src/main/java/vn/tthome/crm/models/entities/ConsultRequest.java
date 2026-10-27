package vn.tthome.crm.models.entities;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A "please advise me" form sent from the web site. Visitors create it; the admin assigns and follows it up. */
@Entity
@Table(name = "consult_request")
@Getter
@Setter
@NoArgsConstructor
public class ConsultRequest {

	@Id
	private UUID id;

	@Column(name = "customer_id")
	private UUID customerId;

	@Column(name = "full_name", updatable = false)
	private String fullName;

	@Column(nullable = false, updatable = false)
	private String phone;

	@Column(name = "area_text", updatable = false)
	private String areaText;

	@Column(name = "budget_max", updatable = false)
	private BigDecimal budgetMax;

	@Column(name = "move_in_date", updatable = false)
	private LocalDate moveInDate;

	@Column(updatable = false)
	private String message;

	@Column(nullable = false, updatable = false)
	private String channel;

	@Column(nullable = false)
	private String status = "new";

	@Column(name = "assigned_to")
	private UUID assignedTo;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

}
