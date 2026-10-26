package vn.tthome.identity.models.entities;

import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.UuidGenerator;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.models.enums.UserType;

@Entity
@Table(name = "user_account")
@Getter
@Setter
@NoArgsConstructor
public class UserAccount {

	@Id
	@GeneratedValue
	@UuidGenerator(style = UuidGenerator.Style.VERSION_7)
	private UUID id;

	private String phone;

	private String email;

	@Column(name = "password_hash")
	private String passwordHash;

	@Column(name = "full_name")
	private String fullName;

	@Column(name = "avatar_url")
	private String avatarUrl;

	@Column(name = "user_type", nullable = false)
	private UserType userType = UserType.TENANT;

	@Column(nullable = false)
	private UserStatus status = UserStatus.ACTIVE;

	@Column(nullable = false)
	private String locale = "vi";

	@Column(name = "phone_verified_at")
	private Instant phoneVerifiedAt;

	@Column(name = "email_verified_at")
	private Instant emailVerifiedAt;

	@Column(name = "failed_login_count", nullable = false)
	private short failedLoginCount;

	@Column(name = "locked_until")
	private Instant lockedUntil;

	@Column(name = "last_login_at")
	private Instant lastLoginAt;

	@Column(name = "created_at", nullable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "updated_at", nullable = false)
	private Instant updatedAt;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Version
	private int version;

	@ManyToMany(fetch = FetchType.EAGER)
	@JoinTable(name = "user_role", joinColumns = @JoinColumn(name = "user_id"),
			inverseJoinColumns = @JoinColumn(name = "role_id"))
	private Set<Role> roles = new HashSet<>();

	@PrePersist
	void onCreate() {
		Instant now = Instant.now();
		createdAt = now;
		updatedAt = now;
	}

	@PreUpdate
	void onUpdate() {
		updatedAt = Instant.now();
	}

}
