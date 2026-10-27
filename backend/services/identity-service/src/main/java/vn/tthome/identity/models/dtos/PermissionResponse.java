package vn.tthome.identity.models.dtos;

import vn.tthome.identity.models.entities.Permission;

public record PermissionResponse(String code, String description) {

	public static PermissionResponse from(Permission permission) {
		return new PermissionResponse(permission.getCode(), permission.getDescription());
	}

}
