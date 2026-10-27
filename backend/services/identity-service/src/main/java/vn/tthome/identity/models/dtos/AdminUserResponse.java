package vn.tthome.identity.models.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.models.enums.UserType;

public record AdminUserResponse(UUID id, String phone, String email, String fullName, UserType userType,
		UserStatus status, List<String> roles, boolean phoneVerified, boolean emailVerified, Instant lastLoginAt,
		Instant lockedUntil, Instant createdAt) {

	public static AdminUserResponse from(UserAccount user) {
		return new AdminUserResponse(user.getId(), user.getPhone(), user.getEmail(), user.getFullName(),
				user.getUserType(), user.getStatus(), user.getRoles().stream().map(Role::getCode).sorted().toList(),
				user.getPhoneVerifiedAt() != null, user.getEmailVerifiedAt() != null, user.getLastLoginAt(),
				user.getLockedUntil(), user.getCreatedAt());
	}

}
