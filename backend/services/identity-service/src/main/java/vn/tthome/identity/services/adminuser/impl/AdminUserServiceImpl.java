package vn.tthome.identity.services.adminuser.impl;

import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.SetRolesRequest;
import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserType;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.adminuser.AdminUserService;
import vn.tthome.identity.services.session.SessionService;

@Service
public class AdminUserServiceImpl implements AdminUserService {

	private static final String ADMIN = "ADMIN";

	private final UserAccountRepository users;
	private final RoleRepository roles;
	private final SessionService sessions;

	public AdminUserServiceImpl(UserAccountRepository users, RoleRepository roles, SessionService sessions) {
		this.users = users;
		this.roles = roles;
		this.sessions = sessions;
	}

	@Override
	@Transactional
	public void setRoles(AccessClaims caller, UUID targetId, SetRolesRequest request) {
		Set<String> wanted = new LinkedHashSet<>(request.roles());
		Map<String, Role> known = roles.findAll().stream().collect(Collectors.toMap(Role::getCode, Function.identity()));
		if (!known.keySet().containsAll(wanted)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unknown role code");
		}
		boolean self = caller.userId().equals(targetId);
		if (self && !wanted.contains(ADMIN)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "An admin cannot remove their own ADMIN role");
		}
		UserAccount user = users.findById(targetId).filter(u -> u.getDeletedAt() == null)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "User not found"));

		Set<Role> next = new HashSet<>();
		wanted.forEach(code -> next.add(known.get(code)));
		user.getRoles().clear();
		user.getRoles().addAll(next);
		user.setUserType(wanted.stream().map(UserType::valueOf).max(Comparator.naturalOrder()).orElse(UserType.TENANT));
		users.saveAndFlush(user);

		if (self) {
			sessions.revokeOthers(targetId, caller.sessionId());
		} else {
			sessions.logoutAll(targetId);
		}
	}

}
