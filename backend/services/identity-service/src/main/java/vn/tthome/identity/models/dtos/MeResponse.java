package vn.tthome.identity.models.dtos;

import java.util.List;
import java.util.UUID;

import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.models.entities.UserAccount;

public record MeResponse(UUID id, String phone, String email, String fullName, List<String> roles) {

	public static MeResponse from(UserAccount user) {
		return new MeResponse(user.getId(), user.getPhone(), user.getEmail(), user.getFullName(),
				user.getRoles().stream().map(Role::getCode).sorted().toList());
	}

}
