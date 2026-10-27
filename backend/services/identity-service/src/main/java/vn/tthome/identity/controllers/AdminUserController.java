package vn.tthome.identity.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.models.dtos.AdminUserResponse;
import vn.tthome.identity.models.dtos.PageResponse;
import vn.tthome.identity.models.dtos.SetRolesRequest;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.services.adminuser.AdminUserService;

@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUserController {

	private final AdminUserService adminUsers;

	public AdminUserController(AdminUserService adminUsers) {
		this.adminUsers = adminUsers;
	}

	@GetMapping
	public PageResponse<AdminUserResponse> list(@RequestParam(required = false) @Size(max = 100) String q,
			@RequestParam(required = false) @Size(max = 32) String role,
			@RequestParam(required = false) UserStatus status, @RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return adminUsers.list(q, role, status, page, size);
	}

	@GetMapping("/{id}")
	public AdminUserResponse get(@PathVariable UUID id) {
		return adminUsers.get(id);
	}

	@PostMapping("/{id}/lock")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void lock(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id) {
		adminUsers.lock(claims, id);
	}

	@PostMapping("/{id}/unlock")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void unlock(@PathVariable UUID id) {
		adminUsers.unlock(id);
	}

	@PutMapping("/{id}/roles")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void setRoles(@AuthenticationPrincipal AccessClaims claims, @PathVariable UUID id,
			@Valid @RequestBody SetRolesRequest body) {
		adminUsers.setRoles(claims, id, body);
	}

}
