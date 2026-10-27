package vn.tthome.cms.models.entities;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** An application to become a collaborator or to join the team, sent from the web site. */
@Entity
@Table(name = "partner_application")
@Getter
@Setter
@NoArgsConstructor
public class PartnerApplication {

	@Id
	private UUID id;

	@Column(nullable = false, updatable = false)
	private String kind;

	@Column(name = "full_name", nullable = false, updatable = false)
	private String fullName;

	@Column(nullable = false, updatable = false)
	private String phone;

	@Column(updatable = false)
	private String email;

	@Column(updatable = false)
	private String message;

	@Column(updatable = false)
	private String position;

	@Column(nullable = false)
	private String status;

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

}
