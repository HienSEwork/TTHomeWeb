package vn.tthome.consignment.models.entities;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A landlord's request to have rooms listed. Landlords send it; the admin reviews it. */
@Entity
@Table(name = "submission")
@Getter
@Setter
@NoArgsConstructor
public class Submission {

	@Id
	private UUID id;

	@Column(nullable = false, updatable = false)
	private String code;

	@Column(name = "landlord_id", updatable = false)
	private UUID landlordId;

	@Column(name = "landlord_name", nullable = false, updatable = false)
	private String landlordName;

	@Column(name = "landlord_phone", nullable = false, updatable = false)
	private String landlordPhone;

	@Column(name = "project_name", updatable = false)
	private String projectName;

	@Column(name = "address_text", nullable = false, updatable = false)
	private String addressText;

	@Column(name = "ward_id", updatable = false)
	private Integer wardId;

	@Column(name = "room_count", updatable = false)
	private Integer roomCount;

	@JdbcTypeCode(SqlTypes.JSON)
	@Column(insertable = false, updatable = false)
	private String rooms;

	@Column(name = "expected_price_min", updatable = false)
	private BigDecimal expectedPriceMin;

	@Column(name = "expected_price_max", updatable = false)
	private BigDecimal expectedPriceMax;

	@Column(updatable = false)
	private String note;

	@Column(nullable = false)
	private String status;

	@Column(name = "reviewer_id")
	private UUID reviewerId;

	@Column(name = "reject_reason")
	private String rejectReason;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

	@Version
	private Integer version;

}
