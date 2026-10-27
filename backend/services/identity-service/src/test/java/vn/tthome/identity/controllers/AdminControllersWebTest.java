package vn.tthome.identity.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.config.SecurityConfig;
import vn.tthome.identity.models.dtos.AdminUserResponse;
import vn.tthome.common.web.PageResponse;
import vn.tthome.identity.models.dtos.PermissionResponse;
import vn.tthome.identity.models.dtos.RoleResponse;
import vn.tthome.identity.models.dtos.SetPermissionsRequest;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.models.enums.UserType;
import vn.tthome.identity.services.adminrole.AdminRoleService;
import vn.tthome.identity.services.adminuser.AdminUserService;
import vn.tthome.identity.services.jwt.JwtService;
import vn.tthome.identity.services.jwt.impl.JwtServiceImpl;
import vn.tthome.identity.support.MutableClock;
import vn.tthome.identity.support.TestAuthProperties;

/** Routing, validation, authorization and error mapping of the admin endpoints, with the services mocked. */
@WebMvcTest({ AdminUserController.class, AdminRoleController.class })
@Import({ SecurityConfig.class, AdminControllersWebTest.JwtConfig.class })
class AdminControllersWebTest {

	@TestConfiguration
	static class JwtConfig {

		@Bean
		JwtService jwtService() {
			return new JwtServiceImpl(TestAuthProperties.defaults(), new MutableClock(Instant.now()));
		}

	}

	private static final UUID ADMIN_ID = UUID.randomUUID();
	private static final UUID TARGET_ID = UUID.randomUUID();

	@Autowired
	MockMvc mvc;
	@Autowired
	JwtService jwt;
	@MockitoBean
	AdminUserService users;
	@MockitoBean
	AdminRoleService roles;

	private String token(String... roleCodes) {
		return "Bearer " + jwt.issueAccessToken(ADMIN_ID, UUID.randomUUID(), List.of(roleCodes));
	}

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", token("ADMIN")));
	}

	private static AdminUserResponse user() {
		return new AdminUserResponse(TARGET_ID, "+84912345678", null, "An", UserType.TENANT, UserStatus.ACTIVE,
				List.of("TENANT"), true, false, null, null, Instant.parse("2026-01-02T03:04:05Z"));
	}

	@Test
	void everyAdminEndpointNeedsAToken() throws Exception {
		for (MockHttpServletRequestBuilder request : List.of(get("/api/v1/admin/users"),
				get("/api/v1/admin/users/" + TARGET_ID), post("/api/v1/admin/users/" + TARGET_ID + "/lock"),
				post("/api/v1/admin/users/" + TARGET_ID + "/unlock"), get("/api/v1/admin/roles"),
				get("/api/v1/admin/permissions"))) {
			mvc.perform(request).andExpect(status().isUnauthorized()).andExpect(jsonPath("$.code").value("TOKEN_INVALID"));
		}
		verifyNoInteractions(users, roles);
	}

	@Test
	void everyAdminEndpointRefusesAStaffToken() throws Exception {
		for (MockHttpServletRequestBuilder request : List.of(get("/api/v1/admin/users"),
				get("/api/v1/admin/users/" + TARGET_ID), post("/api/v1/admin/users/" + TARGET_ID + "/lock"),
				post("/api/v1/admin/users/" + TARGET_ID + "/unlock"), get("/api/v1/admin/roles"),
				get("/api/v1/admin/permissions"),
				put("/api/v1/admin/roles/CONSULTANT/permissions").contentType(MediaType.APPLICATION_JSON)
						.content("{\"permissions\":[]}"))) {
			mvc.perform(request.header("Authorization", token("CONSULTANT", "TENANT"))).andExpect(status().isForbidden())
					.andExpect(jsonPath("$.code").value("FORBIDDEN"));
		}
		verifyNoInteractions(users, roles);
	}

	@Test
	void listUsesTheDefaultPageAndReturnsThePage() throws Exception {
		when(users.list(null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(user()), 0, 20, 1));

		asAdmin(get("/api/v1/admin/users")).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.page").value(0)).andExpect(jsonPath("$.size").value(20))
				.andExpect(jsonPath("$.items[0].id").value(TARGET_ID.toString()))
				.andExpect(jsonPath("$.items[0].status").value("ACTIVE"))
				.andExpect(jsonPath("$.items[0].roles[0]").value("TENANT"))
				.andExpect(jsonPath("$.items[0].passwordHash").doesNotExist());
	}

	@Test
	void listPassesEveryFilterThrough() throws Exception {
		when(users.list("an", "LANDLORD", UserStatus.LOCKED, 3, 50)).thenReturn(new PageResponse<>(List.of(), 3, 50, 0));

		asAdmin(get("/api/v1/admin/users?q=an&role=LANDLORD&status=LOCKED&page=3&size=50")).andExpect(status().isOk());

		verify(users).list("an", "LANDLORD", UserStatus.LOCKED, 3, 50);
	}

	@Test
	void listRejectsBadParameters() throws Exception {
		for (String query : List.of("status=NOPE", "page=-1", "size=0", "size=101", "page=abc",
				"q=" + "x".repeat(101), "role=" + "x".repeat(33))) {
			asAdmin(get("/api/v1/admin/users?" + query)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(users);
	}

	@Test
	void getReturnsTheUserAndMapsNotFound() throws Exception {
		when(users.get(TARGET_ID)).thenReturn(user());
		UUID missing = UUID.randomUUID();
		when(users.get(missing)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "User not found"));

		asAdmin(get("/api/v1/admin/users/" + TARGET_ID)).andExpect(status().isOk())
				.andExpect(jsonPath("$.phoneVerified").value(true)).andExpect(jsonPath("$.emailVerified").value(false));
		asAdmin(get("/api/v1/admin/users/" + missing)).andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
		asAdmin(get("/api/v1/admin/users/not-a-uuid")).andExpect(status().isBadRequest());
	}

	@Test
	void lockPassesTheCallerAndAnswersNoContent() throws Exception {
		asAdmin(post("/api/v1/admin/users/" + TARGET_ID + "/lock")).andExpect(status().isNoContent());

		verify(users).lock(argThat(claims -> claims.userId().equals(ADMIN_ID)), eq(TARGET_ID));
	}

	@Test
	void lockMapsTheServiceErrors() throws Exception {
		org.mockito.Mockito.doThrow(new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "no")).when(users)
				.lock(any(), eq(ADMIN_ID));
		org.mockito.Mockito.doThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The account is disabled"))
				.when(users).lock(any(), eq(TARGET_ID));

		asAdmin(post("/api/v1/admin/users/" + ADMIN_ID + "/lock")).andExpect(status().isForbidden());
		asAdmin(post("/api/v1/admin/users/" + TARGET_ID + "/lock")).andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CONFLICT"));
	}

	@Test
	void unlockAnswersNoContentAndMapsConflict() throws Exception {
		asAdmin(post("/api/v1/admin/users/" + TARGET_ID + "/unlock")).andExpect(status().isNoContent());
		verify(users).unlock(TARGET_ID);

		UUID disabled = UUID.randomUUID();
		org.mockito.Mockito.doThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The account is disabled"))
				.when(users).unlock(disabled);
		asAdmin(post("/api/v1/admin/users/" + disabled + "/unlock")).andExpect(status().isConflict());
	}

	@Test
	void rolesAndPermissionsAreListed() throws Exception {
		when(roles.roles()).thenReturn(List.of(new RoleResponse("CONSULTANT", "Consultant", List.of("crm.manage"))));
		when(roles.permissions()).thenReturn(List.of(new PermissionResponse("crm.manage", "Manage customers")));

		asAdmin(get("/api/v1/admin/roles")).andExpect(status().isOk()).andExpect(jsonPath("$[0].code").value("CONSULTANT"))
				.andExpect(jsonPath("$[0].permissions[0]").value("crm.manage"));
		asAdmin(get("/api/v1/admin/permissions")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].code").value("crm.manage"))
				.andExpect(jsonPath("$[0].description").value("Manage customers"));
	}

	@Test
	void setPermissionsReturnsTheUpdatedRole() throws Exception {
		when(roles.setPermissions(eq("CONSULTANT"), any(SetPermissionsRequest.class)))
				.thenReturn(new RoleResponse("CONSULTANT", "Consultant", List.of("crm.manage")));

		asAdmin(put("/api/v1/admin/roles/CONSULTANT/permissions").contentType(MediaType.APPLICATION_JSON)
				.content("{\"permissions\":[\"crm.manage\"]}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.permissions[0]").value("crm.manage"));

		verify(roles).setPermissions("CONSULTANT", new SetPermissionsRequest(List.of("crm.manage")));
	}

	@Test
	void setPermissionsRejectsInvalidBodies() throws Exception {
		for (String body : List.of("{}", "{\"permissions\":null}", "{\"permissions\":[\"\"]}",
				"{\"permissions\":[\"" + "x".repeat(65) + "\"]}", "{\"permissions\":\"nope\"}",
				"not json")) {
			asAdmin(put("/api/v1/admin/roles/CONSULTANT/permissions").contentType(MediaType.APPLICATION_JSON).content(body))
					.andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		verifyNoInteractions(roles);
	}

	@Test
	void setPermissionsMapsTheServiceErrors() throws Exception {
		when(roles.setPermissions(eq("ADMIN"), any()))
				.thenThrow(new ApiException(HttpStatus.FORBIDDEN, "FORBIDDEN", "fixed"));
		when(roles.setPermissions(eq("NOPE"), any()))
				.thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Role not found"));

		asAdmin(put("/api/v1/admin/roles/ADMIN/permissions").contentType(MediaType.APPLICATION_JSON)
				.content("{\"permissions\":[]}")).andExpect(status().isForbidden());
		asAdmin(put("/api/v1/admin/roles/NOPE/permissions").contentType(MediaType.APPLICATION_JSON)
				.content("{\"permissions\":[]}")).andExpect(status().isNotFound());
	}

}
