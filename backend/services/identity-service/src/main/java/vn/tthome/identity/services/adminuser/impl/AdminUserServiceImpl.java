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

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.AdminUserResponse;
import vn.tthome.identity.models.dtos.PageResponse;
import vn.tthome.identity.models.dtos.SetRolesRequest;
import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.models.enums.UserType;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.adminuser.AdminUserService;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;
import vn.tthome.identity.services.session.SessionService;

@Service
public class AdminUserServiceImpl implements AdminUserService {

	private static final String ADMIN = "ADMIN";

	private final UserAccountRepository users;
	private final RoleRepository roles;
	private final SessionService sessions;
	private final ContactNormalizer normalizer;

	public AdminUserServiceImpl(UserAccountRepository users, RoleRepository roles, SessionService sessions,
			ContactNormalizer normalizer) {
		this.users = users;
		this.roles = roles;
		this.sessions = sessions;
		this.normalizer = normalizer;
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

	@Override
	@Transactional(readOnly = true)
	public PageResponse<AdminUserResponse> list(String text, String role, UserStatus status, int page, int size) {
		String roleCode = blankToNull(role);
		if (roleCode != null && roles.findByCode(roleCode).isEmpty()) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unknown role code");
		}
		String search = blankToNull(text);
		return PageResponse.of(users.search(search, search == null ? null : phoneOrNull(search), roleCode, status,
				PageRequest.of(page, size)), AdminUserResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public AdminUserResponse get(UUID id) {
		return AdminUserResponse.from(find(id));
	}

	@Override
	@Transactional
	public void lock(AccessClaims caller, UUID id) {
		if (caller.userId().equals(id)) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "An admin cannot lock their own account");
		}
		UserAccount user = find(id);
		if (user.getStatus() == UserStatus.LOCKED) {
			return;
		}
		if (user.getStatus() != UserStatus.ACTIVE) {
			throw conflict(user);
		}
		user.setStatus(UserStatus.LOCKED);
		users.saveAndFlush(user);
		sessions.logoutAll(id);
	}

	@Override
	@Transactional
	public void unlock(UUID id) {
		UserAccount user = find(id);
		if (user.getStatus() == UserStatus.ACTIVE) {
			return;
		}
		if (user.getStatus() != UserStatus.LOCKED) {
			throw conflict(user);
		}
		user.setStatus(UserStatus.ACTIVE);
		user.setFailedLoginCount((short) 0);
		user.setLockedUntil(null);
		users.saveAndFlush(user);
	}

	private UserAccount find(UUID id) {
		return users.findById(id).filter(u -> u.getDeletedAt() == null)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "User not found"));
	}

	private static ApiException conflict(UserAccount user) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The account is " + user.getStatus().value());
	}

	/** The stored form of a typed phone number, or null when the text is not a Vietnamese mobile number. */
	private String phoneOrNull(String text) {
		try {
			return normalizer.phone(text);
		} catch (ApiException e) {
			return null;
		}
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
