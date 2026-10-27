package vn.tthome.identity.services.adminrole.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.PermissionResponse;
import vn.tthome.identity.models.dtos.RoleResponse;
import vn.tthome.identity.models.dtos.SetPermissionsRequest;
import vn.tthome.identity.models.entities.Permission;
import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.repos.permission.PermissionRepository;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.services.adminrole.AdminRoleService;

@Service
public class AdminRoleServiceImpl implements AdminRoleService {

	private static final String ADMIN = "ADMIN";

	private final RoleRepository roles;
	private final PermissionRepository permissions;

	public AdminRoleServiceImpl(RoleRepository roles, PermissionRepository permissions) {
		this.roles = roles;
		this.permissions = permissions;
	}

	@Override
	@Transactional(readOnly = true)
	public List<RoleResponse> roles() {
		return roles.findAllByOrderByIdAsc().stream().map(RoleResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public List<PermissionResponse> permissions() {
		return permissions.findAll(Sort.by("code")).stream().map(PermissionResponse::from).toList();
	}

	@Override
	@Transactional
	public RoleResponse setPermissions(String roleCode, SetPermissionsRequest request) {
		Role role = roles.findByCode(roleCode)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Role not found"));
		if (ADMIN.equals(role.getCode())) {
			throw new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "The permissions of ADMIN are fixed");
		}
		Set<String> wanted = new HashSet<>(request.permissions());
		Map<String, Permission> known = permissions.findAll().stream()
				.collect(Collectors.toMap(Permission::getCode, Function.identity()));
		if (!known.keySet().containsAll(wanted)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Unknown permission code");
		}
		role.setPermissions(wanted.stream().map(known::get).collect(Collectors.toCollection(HashSet::new)));
		return RoleResponse.from(roles.saveAndFlush(role));
	}

}
