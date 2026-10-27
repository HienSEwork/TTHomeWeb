package vn.tthome.identity.controllers;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.tthome.identity.models.dtos.PermissionResponse;
import vn.tthome.identity.models.dtos.RoleResponse;
import vn.tthome.identity.models.dtos.SetPermissionsRequest;
import vn.tthome.identity.services.adminrole.AdminRoleService;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRoleController {

	private final AdminRoleService adminRoles;

	public AdminRoleController(AdminRoleService adminRoles) {
		this.adminRoles = adminRoles;
	}

	@GetMapping("/roles")
	public List<RoleResponse> roles() {
		return adminRoles.roles();
	}

	@GetMapping("/permissions")
	public List<PermissionResponse> permissions() {
		return adminRoles.permissions();
	}

	@PutMapping("/roles/{code}/permissions")
	public RoleResponse setPermissions(@PathVariable String code, @Valid @RequestBody SetPermissionsRequest body) {
		return adminRoles.setPermissions(code, body);
	}

}
