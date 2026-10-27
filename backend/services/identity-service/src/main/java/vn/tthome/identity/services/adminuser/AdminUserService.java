package vn.tthome.identity.services.adminuser;

import java.util.UUID;

import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.AdminUserResponse;
import vn.tthome.common.web.PageResponse;
import vn.tthome.identity.models.dtos.SetRolesRequest;
import vn.tthome.identity.models.enums.UserStatus;

/** Administration of other users: listing, lock and unlock, and roles. */
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


	/**
	 * One page of accounts, newest first. text is a substring of email, full name or phone (a Vietnamese number in any
	 * accepted spelling also matches the stored number exactly); blank filters are ignored.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for an unknown role code.
	 */
	PageResponse<AdminUserResponse> list(String text, String role, UserStatus status, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown user. */
	AdminUserResponse get(UUID id);

	/**
	 * Locks an active account and revokes its sessions; locking a locked account does nothing.
	 *
	 * @throws vn.tthome.common.error.ApiException 403 FORBIDDEN when an admin locks themselves, 404 NOT_FOUND for an
	 *         unknown user, 409 CONFLICT for a disabled account or one pending deletion.
	 */
	void lock(AccessClaims caller, UUID id);

	/**
	 * Unlocks a locked account and clears its failed-login counter; unlocking an active account does nothing.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown user, 409 CONFLICT for a disabled
	 *         account or one pending deletion.
	 */
	void unlock(UUID id);

}
