package vn.tthome.identity.models.dtos;

import java.util.List;

import vn.tthome.identity.models.entities.Permission;
import vn.tthome.identity.models.entities.Role;

public record RoleResponse(String code, String name, List<String> permissions) {

	public static RoleResponse from(Role role) {
		return new RoleResponse(role.getCode(), role.getName(),
				role.getPermissions().stream().map(Permission::getCode).sorted().toList());
	}

}
