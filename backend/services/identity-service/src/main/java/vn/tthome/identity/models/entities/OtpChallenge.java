package vn.tthome.identity.models.entities;

import java.net.InetAddress;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UuidGenerator;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;

@Entity
@Table(name = "otp_challenge")
@Getter
@Setter
@NoArgsConstructor
public class OtpChallenge {

	@Id
	@GeneratedValue
	@UuidGenerator(style = UuidGenerator.Style.VERSION_7)
	private UUID id;

	@Column(nullable = false)
	private String target;

	@Column(nullable = false)
	private OtpPurpose purpose;

	@Column(nullable = false)
	private OtpChannel channel;

	@Column(name = "code_hash", nullable = false)
	private String codeHash;

	@Column(nullable = false)
	private short attempts;

	@JdbcTypeCode(SqlTypes.INET)
	private InetAddress ip;

	@Column(name = "device_id")
	private String deviceId;

	@Column(name = "expires_at", nullable = false)
	private Instant expiresAt;

	@Column(name = "consumed_at")
	private Instant consumedAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@PrePersist
	void onCreate() {
		createdAt = Instant.now();
	}

}
