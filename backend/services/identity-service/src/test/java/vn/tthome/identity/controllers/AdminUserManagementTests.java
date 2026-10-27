package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.services.jwt.JwtService;
import vn.tthome.identity.services.passwordhasher.PasswordHasher;

/** The admin user and role endpoints against a real PostgreSQL: queries, lock and unlock, permissions. */
@AutoConfigureMockMvc
class AdminUserManagementTests extends IdentityIntegrationTestBase {

	private static final String PASSWORD = "correct-horse-battery";
	private static final AtomicInteger COUNTER = new AtomicInteger(40000);
	private static final OffsetDateTime BASE = OffsetDateTime.parse("2026-03-01T00:00:00Z");

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;
	@Autowired
	JwtService jwt;
	@Autowired
	PasswordHasher hasher;

	@AfterEach
	void restoreConsultantPermissions() {
		jdbc.sql("delete from identity.role_permission where role_id = (select id from identity.role where code = 'CONSULTANT')")
				.update();
	}

	/** GET /api/v1/admin/users with the query given unencoded as key=value&key=value. */
	private static MockHttpServletRequestBuilder list(String query) {
		MockHttpServletRequestBuilder request = get("/api/v1/admin/users");
		for (String pair : query.split("&")) {
			int eq = pair.indexOf('=');
			request = request.param(pair.substring(0, eq), pair.substring(eq + 1));
		}
		return request;
	}

	private static String marker() {
		return "mk" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	private static String ip() {
		return "198.51.97." + (COUNTER.incrementAndGet() % 250 + 1);
	}

	private String adminToken(UUID adminId) {
		return "Bearer " + jwt.issueAccessToken(adminId, UUID.randomUUID(), List.of("ADMIN"));
	}

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", adminToken(UUID.randomUUID())));
	}

	/** Inserts an account; createdAt orders the list, so each test controls it with minutesAfterBase. */
	private UUID insertUser(String email, String phone, String fullName, String status, int minutesAfterBase,
			boolean deleted, String passwordHash, String... roleCodes) {
		UUID id = UUID.randomUUID();
		OffsetDateTime created = BASE.plusMinutes(minutesAfterBase);
		jdbc.sql("insert into identity.user_account (id, email, phone, full_name, status, password_hash, created_at, "
				+ "deleted_at) values (:id, :email, :phone, :name, :status, :hash, :created, :deleted)")
				.param("id", id).param("email", email).param("phone", phone).param("name", fullName)
				.param("status", status).param("hash", passwordHash).param("created", created)
				.param("deleted", deleted ? created : null).update();
		for (String code : roleCodes) {
			jdbc.sql("insert into identity.user_role (user_id, role_id) select :id, r.id from identity.role r "
					+ "where r.code = :code").param("id", id).param("code", code).update();
		}
		return id;
	}

	private UUID plainUser(String email, String status, int minutesAfterBase, String... roleCodes) {
		return insertUser(email, null, null, status, minutesAfterBase, false, null, roleCodes);
	}

	private String statusOf(UUID id) {
		return jdbc.sql("select status from identity.user_account where id = :id").param("id", id).query(String.class)
				.single();
	}

	private ResultActions login(String email) throws Exception {
		return mvc.perform(post("/api/v1/auth/login").contentType(MediaType.APPLICATION_JSON)
				.content("{\"identifier\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}")
				.with(request -> {
					request.setRemoteAddr(ip());
					return request;
				}));
	}

	// --- listing -------------------------------------------------------------------------------------------------

	@Test
	void listIsNewestFirstAndPagesWithoutLosingOrDuplicatingRows() throws Exception {
		String m = marker();
		UUID oldest = plainUser("a." + m + "@example.test", "active", 1);
		UUID middle = plainUser("b." + m + "@example.test", "active", 2);
		UUID newest = plainUser("c." + m + "@example.test", "locked", 3);

		asAdmin(list("q=" + m)).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(3))
				.andExpect(jsonPath("$.items.length()").value(3))
				.andExpect(jsonPath("$.items[0].id").value(newest.toString()))
				.andExpect(jsonPath("$.items[1].id").value(middle.toString()))
				.andExpect(jsonPath("$.items[2].id").value(oldest.toString()));
		asAdmin(list("q=" + m + "&size=2&page=0")).andExpect(jsonPath("$.items.length()").value(2))
				.andExpect(jsonPath("$.total").value(3)).andExpect(jsonPath("$.items[1].id").value(middle.toString()));
		asAdmin(list("q=" + m + "&size=2&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].id").value(oldest.toString()));
		asAdmin(list("q=" + m + "&size=2&page=5")).andExpect(status().isOk())
				.andExpect(jsonPath("$.items.length()").value(0)).andExpect(jsonPath("$.total").value(3));
	}

	@Test
	void listFiltersByStatusAndRoleAndReturnsEveryRoleOfAMultiRoleUserOnce() throws Exception {
		String m = marker();
		UUID landlordAgent = plainUser("a." + m + "@example.test", "active", 1, "LANDLORD", "AGENT");
		UUID locked = plainUser("b." + m + "@example.test", "locked", 2, "TENANT");
		plainUser("c." + m + "@example.test", "active", 3, "TENANT");

		asAdmin(list("q=" + m + "&status=LOCKED")).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].id").value(locked.toString()))
				.andExpect(jsonPath("$.items[0].status").value("LOCKED"));
		asAdmin(list("q=" + m + "&role=AGENT")).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].id").value(landlordAgent.toString()))
				.andExpect(jsonPath("$.items[0].roles[0]").value("AGENT"))
				.andExpect(jsonPath("$.items[0].roles[1]").value("LANDLORD"))
				.andExpect(jsonPath("$.items[0].roles.length()").value(2));
		asAdmin(list("q=" + m + "&role=TENANT&status=ACTIVE")).andExpect(jsonPath("$.total").value(1));
		asAdmin(list("role=NOPE")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void listSearchIsCaseInsensitiveOverEmailAndNameAndTreatsWildcardsAsText() throws Exception {
		String m = marker();
		UUID byEmail = plainUser("Mixed." + m + "@Example.test", "active", 1);
		UUID byName = insertUser("n." + m + "@example.test", null, "Nguyen Van " + m.toUpperCase(), "active", 2, false,
				null);
		UUID percent = insertUser("p." + m + "@example.test", null, "50%off" + m, "active", 3, false, null);
		insertUser("q." + m + "@example.test", null, "50Xoff" + m, "active", 4, false, null);

		asAdmin(list("q=MIXED." + m.toUpperCase())).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].id").value(byEmail.toString()));
		asAdmin(list("q=nguyen van " + m)).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].id").value(byName.toString()));
		asAdmin(list("q=50%off" + m)).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].id").value(percent.toString()));
		asAdmin(list("q=" + m.substring(0, 6) + "_" + m.substring(7))).andExpect(jsonPath("$.total").value(0));
	}

	@Test
	void listFindsAPhoneTypedInAnyAcceptedSpellingOrAsAFragment() throws Exception {
		String digits = String.format("9%08d", Math.floorMod(UUID.randomUUID().getMostSignificantBits(), 100_000_000));
		UUID user = insertUser(null, "+84" + digits, "Phone " + marker(), "active", 1, false, null);
		String id = user.toString();

		for (String typed : List.of("0" + digits, "84" + digits, "+84" + digits, digits.substring(2, 8))) {
			asAdmin(list("q=" + typed)).andExpect(status().isOk())
					.andExpect(jsonPath("$.items[*].id", hasItems(id)));
		}
	}

	@Test
	void listLeavesOutDeletedAccountsAndIgnoresBlankFilters() throws Exception {
		String m = marker();
		plainUser("live." + m + "@example.test", "active", 1);
		insertUser("gone." + m + "@example.test", null, null, "active", 2, true, null);

		asAdmin(list("q=" + m + "&status=&role=")).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items.length()").value(1));
	}

	// --- detail --------------------------------------------------------------------------------------------------

	@Test
	void getReturnsTheAccountWithoutSecretsAndKnowsUnknownAndDeletedAccounts() throws Exception {
		String m = marker();
		UUID id = insertUser("d." + m + "@example.test", null, "Detail " + m, "active", 1, false, "$argon2id$secret",
				"CONSULTANT");
		UUID deleted = insertUser("x." + m + "@example.test", null, null, "active", 2, true, null);

		asAdmin(get("/api/v1/admin/users/" + id)).andExpect(status().isOk())
				.andExpect(jsonPath("$.email").value("d." + m + "@example.test"))
				.andExpect(jsonPath("$.fullName").value("Detail " + m)).andExpect(jsonPath("$.roles[0]").value("CONSULTANT"))
				.andExpect(jsonPath("$.passwordHash").doesNotExist()).andExpect(jsonPath("$.emailVerified").value(false));
		asAdmin(get("/api/v1/admin/users/" + deleted)).andExpect(status().isNotFound());
		asAdmin(get("/api/v1/admin/users/" + UUID.randomUUID())).andExpect(status().isNotFound());
	}

	// --- lock and unlock -----------------------------------------------------------------------------------------

	@Test
	void lockingBlocksLoginAndRefreshAndUnlockingRestoresThem() throws Exception {
		String m = marker();
		String email = "lock." + m + "@example.test";
		UUID id = insertUser(email, null, null, "active", 1, false, hasher.hash(PASSWORD));
		String refreshToken = login(email).andExpect(status().isOk()).andReturn().getResponse().getContentAsString()
				.replaceAll(".*\"refreshToken\":\"([^\"]+)\".*", "$1");

		asAdmin(post("/api/v1/admin/users/" + id + "/lock")).andExpect(status().isNoContent());

		assertThat(statusOf(id)).isEqualTo("locked");
		login(email).andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("ACCOUNT_DISABLED"));
		mvc.perform(post("/api/v1/auth/refresh").contentType(MediaType.APPLICATION_JSON)
				.content("{\"refreshToken\":\"" + refreshToken + "\"}").with(request -> {
					request.setRemoteAddr(ip());
					return request;
				})).andExpect(status().isUnauthorized());
		asAdmin(post("/api/v1/admin/users/" + id + "/lock")).andExpect(status().isNoContent());

		asAdmin(post("/api/v1/admin/users/" + id + "/unlock")).andExpect(status().isNoContent());

		assertThat(statusOf(id)).isEqualTo("active");
		login(email).andExpect(status().isOk());
		asAdmin(post("/api/v1/admin/users/" + id + "/unlock")).andExpect(status().isNoContent());
	}

	@Test
	void unlockClearsTheFailedLoginCounterAndTemporaryLock() throws Exception {
		UUID id = plainUser("tmp." + marker() + "@example.test", "locked", 1);
		jdbc.sql("update identity.user_account set failed_login_count = 5, locked_until = now() + interval '1 hour' "
				+ "where id = :id").param("id", id).update();

		asAdmin(post("/api/v1/admin/users/" + id + "/unlock")).andExpect(status().isNoContent());

		assertThat(jdbc.sql("select failed_login_count from identity.user_account where id = :id").param("id", id)
				.query(Integer.class).single()).isZero();
		assertThat(jdbc.sql("select locked_until from identity.user_account where id = :id").param("id", id)
				.query(java.sql.Timestamp.class).optional()).isEmpty();
	}

	@Test
	void lockAndUnlockRefuseDisabledAndPendingDeleteAccountsAndUnknownUsers() throws Exception {
		for (String state : List.of("disabled", "pending_delete")) {
			UUID id = plainUser("s." + marker() + "@example.test", state, 1);

			asAdmin(post("/api/v1/admin/users/" + id + "/lock")).andExpect(status().isConflict())
					.andExpect(jsonPath("$.code").value("CONFLICT"));
			asAdmin(post("/api/v1/admin/users/" + id + "/unlock")).andExpect(status().isConflict());

			assertThat(statusOf(id)).isEqualTo(state);
		}
		asAdmin(post("/api/v1/admin/users/" + UUID.randomUUID() + "/lock")).andExpect(status().isNotFound());
		asAdmin(post("/api/v1/admin/users/" + UUID.randomUUID() + "/unlock")).andExpect(status().isNotFound());
	}

	@Test
	void anAdminCannotLockThemselves() throws Exception {
		UUID id = plainUser("self." + marker() + "@example.test", "active", 1, "ADMIN");

		mvc.perform(post("/api/v1/admin/users/" + id + "/lock").header("Authorization", adminToken(id)))
				.andExpect(status().isForbidden());

		assertThat(statusOf(id)).isEqualTo("active");
	}

	// --- roles and permissions -----------------------------------------------------------------------------------

	@Test
	void theMigrationSeedsThePermissionCatalogAndRolesListEveryRole() throws Exception {
		asAdmin(get("/api/v1/admin/permissions")).andExpect(status().isOk())
				.andExpect(jsonPath("$[*].code", hasItems("dashboard.view", "listing.manage", "consignment.review",
						"booking.manage", "crm.manage", "user.manage", "cms.manage", "catalog.manage",
						"collaborator.manage", "report.view", "audit.view")));
		asAdmin(get("/api/v1/admin/roles")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(5))
				.andExpect(jsonPath("$[0].code").value("TENANT")).andExpect(jsonPath("$[4].code").value("ADMIN"));
	}

	@Test
	void permissionsOfARoleAreReplacedAndCanBeCleared() throws Exception {
		asAdmin(permissionsRequest("CONSULTANT", "[\"crm.manage\",\"booking.manage\"]"))
				.andExpect(status().isOk());
		asAdmin(get("/api/v1/admin/roles")).andExpect(jsonPath("$[3].code").value("CONSULTANT"))
				.andExpect(jsonPath("$[3].permissions.length()").value(2))
				.andExpect(jsonPath("$[3].permissions[0]").value("booking.manage"))
				.andExpect(jsonPath("$[3].permissions[1]").value("crm.manage"));

		asAdmin(permissionsRequest("CONSULTANT", "[\"report.view\",\"report.view\"]")).andExpect(status().isOk())
				.andExpect(jsonPath("$.permissions.length()").value(1)).andExpect(jsonPath("$.permissions[0]").value("report.view"));
		assertThat(jdbc.sql("select count(*) from identity.role_permission rp join identity.role r on r.id = rp.role_id "
				+ "where r.code = 'CONSULTANT'").query(Integer.class).single()).isEqualTo(1);

		asAdmin(permissionsRequest("CONSULTANT", "[]")).andExpect(status().isOk())
				.andExpect(jsonPath("$.permissions.length()").value(0));
		assertThat(jdbc.sql("select count(*) from identity.role_permission rp join identity.role r on r.id = rp.role_id "
				+ "where r.code = 'CONSULTANT'").query(Integer.class).single()).isZero();
	}

	@Test
	void anUnknownPermissionLeavesTheRoleUntouchedAndAdminAndUnknownRolesAreRefused() throws Exception {
		asAdmin(permissionsRequest("CONSULTANT", "[\"crm.manage\"]")).andExpect(status().isOk());

		asAdmin(permissionsRequest("CONSULTANT", "[\"crm.manage\",\"made.up\"]")).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		assertThat(jdbc.sql("select p.code from identity.role_permission rp join identity.role r on r.id = rp.role_id "
				+ "join identity.permission p on p.id = rp.permission_id where r.code = 'CONSULTANT'")
				.query(String.class).list()).containsExactly("crm.manage");

		asAdmin(permissionsRequest("ADMIN", "[]")).andExpect(status().isForbidden());
		asAdmin(permissionsRequest("NOPE", "[]")).andExpect(status().isNotFound());
	}

	private static MockHttpServletRequestBuilder permissionsRequest(String role, String permissionsJson) {
		return put("/api/v1/admin/roles/" + role + "/permissions").contentType(MediaType.APPLICATION_JSON)
				.content("{\"permissions\":" + permissionsJson + "}");
	}

}
