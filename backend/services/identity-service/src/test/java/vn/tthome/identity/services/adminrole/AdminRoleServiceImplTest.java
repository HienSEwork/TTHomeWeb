package vn.tthome.identity.services.adminrole;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.lang.reflect.Field;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.RoleResponse;
import vn.tthome.identity.models.dtos.SetPermissionsRequest;
import vn.tthome.identity.models.entities.Permission;
import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.repos.permission.PermissionRepository;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.services.adminrole.impl.AdminRoleServiceImpl;

@ExtendWith(MockitoExtension.class)
class AdminRoleServiceImplTest {

	@Mock
	RoleRepository roles;
	@Mock
	PermissionRepository permissions;

	private AdminRoleServiceImpl service() {
		return new AdminRoleServiceImpl(roles, permissions);
	}

	/** Entities have no setters for their key fields; the database fills them in production. */
	private static <T> T with(T entity, String field, Object value) {
		try {
			Field f = entity.getClass().getDeclaredField(field);
			f.setAccessible(true);
			f.set(entity, value);
			return entity;
		} catch (ReflectiveOperationException e) {
			throw new IllegalStateException(e);
		}
	}

	private static Role role(String code) {
		return with(with(new Role(), "code", code), "name", code.toLowerCase());
	}

	private static Permission permission(String code) {
		return with(new Permission(), "code", code);
	}

	@Test
	void setPermissionsReplacesTheWholeSet() {
		Role consultant = role("CONSULTANT");
		consultant.setPermissions(new HashSet<>(List.of(permission("old.permission"))));
		when(roles.findByCode("CONSULTANT")).thenReturn(Optional.of(consultant));
		when(permissions.findAll()).thenReturn(List.of(permission("booking.manage"), permission("crm.manage"),
				permission("old.permission")));
		when(roles.saveAndFlush(consultant)).thenReturn(consultant);

		RoleResponse response = service()
				.setPermissions("CONSULTANT", new SetPermissionsRequest(List.of("crm.manage", "booking.manage", "crm.manage")));

		assertThat(response.code()).isEqualTo("CONSULTANT");
		assertThat(response.permissions()).containsExactly("booking.manage", "crm.manage");
	}

	@Test
	void setPermissionsWithAnEmptyListRevokesEverything() {
		Role consultant = role("CONSULTANT");
		consultant.setPermissions(new HashSet<>(List.of(permission("crm.manage"))));
		when(roles.findByCode("CONSULTANT")).thenReturn(Optional.of(consultant));
		when(permissions.findAll()).thenReturn(List.of(permission("crm.manage")));
		when(roles.saveAndFlush(consultant)).thenReturn(consultant);

		RoleResponse response = service().setPermissions("CONSULTANT", new SetPermissionsRequest(List.of()));

		assertThat(response.permissions()).isEmpty();
	}

	@Test
	void setPermissionsRejectsAnUnknownPermissionWithoutChangingTheRole() {
		Role consultant = role("CONSULTANT");
		consultant.setPermissions(new HashSet<>(List.of(permission("crm.manage"))));
		when(roles.findByCode("CONSULTANT")).thenReturn(Optional.of(consultant));
		when(permissions.findAll()).thenReturn(List.of(permission("crm.manage")));

		assertThatThrownBy(() -> service().setPermissions("CONSULTANT",
				new SetPermissionsRequest(List.of("crm.manage", "made.up"))))
				.isInstanceOfSatisfying(ApiException.class, e -> {
					assertThat(e.status()).isEqualTo(HttpStatus.BAD_REQUEST);
					assertThat(e.code()).isEqualTo("VALIDATION_ERROR");
				});

		assertThat(consultant.getPermissions()).extracting(Permission::getCode).containsExactly("crm.manage");
		verify(roles, never()).saveAndFlush(consultant);
	}

	@Test
	void theAdminRoleIsNotConfigurable() {
		when(roles.findByCode("ADMIN")).thenReturn(Optional.of(role("ADMIN")));

		assertThatThrownBy(() -> service().setPermissions("ADMIN", new SetPermissionsRequest(List.of())))
				.isInstanceOfSatisfying(ApiException.class, e -> {
					assertThat(e.status()).isEqualTo(HttpStatus.FORBIDDEN);
					assertThat(e.code()).isEqualTo("FORBIDDEN");
				});

		verify(roles, never()).saveAndFlush(org.mockito.ArgumentMatchers.any());
	}

	@Test
	void anUnknownRoleIsNotFound() {
		when(roles.findByCode("NOPE")).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().setPermissions("NOPE", new SetPermissionsRequest(List.of())))
				.isInstanceOfSatisfying(ApiException.class, e -> {
					assertThat(e.status()).isEqualTo(HttpStatus.NOT_FOUND);
					assertThat(e.code()).isEqualTo("NOT_FOUND");
				});
	}

	@Test
	void rolesListEveryRoleWithSortedPermissionCodes() {
		Role consultant = role("CONSULTANT");
		consultant.setPermissions(new HashSet<>(List.of(permission("crm.manage"), permission("booking.manage"))));
		when(roles.findAllByOrderByIdAsc()).thenReturn(List.of(role("TENANT"), consultant));

		List<RoleResponse> result = service().roles();

		assertThat(result).extracting(RoleResponse::code).containsExactly("TENANT", "CONSULTANT");
		assertThat(result.get(0).permissions()).isEmpty();
		assertThat(result.get(1).permissions()).containsExactly("booking.manage", "crm.manage");
	}

}
