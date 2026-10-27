package vn.tthome.identity.services.adminrole;

import java.util.List;

import vn.tthome.identity.models.dtos.PermissionResponse;
import vn.tthome.identity.models.dtos.RoleResponse;
import vn.tthome.identity.models.dtos.SetPermissionsRequest;

/** Administration of which permissions each role grants (the staff permissions). */
public interface AdminRoleService {

	/** Every role with its permissions. */
	List<RoleResponse> roles();

	/** The permission catalog. */
	List<PermissionResponse> permissions();

	/**
	 * Replaces the permissions of a role.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for an unknown permission code, 403 FORBIDDEN for
	 *         the ADMIN role, whose access is not configurable, 404 NOT_FOUND for an unknown role.
	 */
	RoleResponse setPermissions(String roleCode, SetPermissionsRequest request);

}
