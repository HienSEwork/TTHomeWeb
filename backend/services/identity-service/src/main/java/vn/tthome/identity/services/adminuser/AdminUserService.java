package vn.tthome.identity.services.adminuser;

import java.util.UUID;

import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.SetRolesRequest;

/** Administration of other users' roles. */
public interface AdminUserService {

	/**
	 * Replaces the roles of a user and revokes the user's sessions so that the old roles do not live on in refresh
	 * tokens. Access tokens already issued keep their roles until they expire (at most 15 minutes). When an admin edits
	 * their own roles, their current session is kept.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for an unknown role code, 403 FORBIDDEN when an
	 *         admin tries to remove their own ADMIN role, 404 NOT_FOUND for an unknown user.
	 */
	void setRoles(AccessClaims caller, UUID targetId, SetRolesRequest request);

}
