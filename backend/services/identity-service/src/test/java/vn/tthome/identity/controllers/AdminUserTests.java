package vn.tthome.identity.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.services.jwt.JwtService;
import vn.tthome.identity.support.InMemoryMessageSender;
import vn.tthome.identity.support.MutableClock;

@AutoConfigureMockMvc
class AdminUserTests extends IdentityIntegrationTestBase {

	private static final String PASSWORD = "correct-horse-battery";
	private static final AtomicInteger COUNTER = new AtomicInteger(21000);

	@Autowired
	MockMvc mvc;
	@Autowired
	InMemoryMessageSender sender;
	@Autowired
	MutableClock clock;
	@Autowired
	JdbcClient jdbc;
	@Autowired
	JwtService jwt;

	private static String ip() {
		return "198.51.98." + (COUNTER.incrementAndGet() % 250 + 1);
	}

	private static RequestPostProcessor fromIp(String ip) {
		return request -> {
			request.setRemoteAddr(ip);
			return request;
		};
	}

	private ResultActions postJson(String path, String json) throws Exception {
		return mvc.perform(post(path).contentType(MediaType.APPLICATION_JSON).content(json).with(fromIp(ip())));
	}

	private ResultActions putRoles(String targetId, String json, String accessToken) throws Exception {
		var request = put("/api/v1/admin/users/" + targetId + "/roles").contentType(MediaType.APPLICATION_JSON)
				.content(json).with(fromIp(ip()));
		if (accessToken != null) {
			request = request.header("Authorization", "Bearer " + accessToken);
		}
		return mvc.perform(request);
	}

	private static String field(String json, String name) {
		return json.replaceAll(".*\"" + name + "\":\"([^\"]+)\".*", "$1");
	}

	private static String newPhone() {
		return "09" + String.format("%08d", 60_000_000 + COUNTER.incrementAndGet() * 23);
	}

	/** Registers a phone account with a password and returns its local phone number. */
	private String newAccount() throws Exception {
		String phone = newPhone();
		clock.advance(Duration.ofSeconds(61));
		postJson("/api/v1/auth/register/phone/request", "{\"phone\":\"" + phone + "\"}").andExpect(status().isAccepted());
		String code = sender.lastCode("+84" + phone.substring(1), OtpPurpose.REGISTER);
		postJson("/api/v1/auth/register/phone/verify",
				"{\"phone\":\"" + phone + "\",\"code\":\"" + code + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk());
		return phone;
	}

	private String login(String phone) throws Exception {
		return postJson("/api/v1/auth/login", "{\"identifier\":\"" + phone + "\",\"password\":\"" + PASSWORD + "\"}")
				.andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
	}

	private String idOf(String phone) {
		return jdbc.sql("select id::text from identity.user_account where phone = :p")
				.param("p", "+84" + phone.substring(1)).query(String.class).single();
	}

	/** Makes the account an admin by SQL, as the first admin is promoted in a real deployment. */
	private String adminLogin() throws Exception {
		String phone = newAccount();
		jdbc.sql("insert into identity.user_role (user_id, role_id) select u.id, r.id from identity.user_account u, "
				+ "identity.role r where u.phone = :p and r.code = 'ADMIN' on conflict do nothing")
				.param("p", "+84" + phone.substring(1)).update();
		return login(phone);
	}

	private List<String> rolesOf(String id) {
		return jdbc.sql("select r.code from identity.user_role ur join identity.role r on r.id = ur.role_id "
				+ "where ur.user_id = cast(:id as uuid) order by r.code").param("id", id).query(String.class).list();
	}

	@Test
	void adminCanReplaceRolesAndTargetSessionsAreRevoked() throws Exception {
		String admin = field(adminLogin(), "accessToken");
		String targetPhone = newAccount();
		String targetSession = login(targetPhone);
		String targetId = idOf(targetPhone);

		putRoles(targetId, "{\"roles\":[\"LANDLORD\",\"TENANT\"]}", admin).andExpect(status().isNoContent());

		assertThat(rolesOf(targetId)).containsExactly("LANDLORD", "TENANT");
		postJson("/api/v1/auth/refresh", "{\"refreshToken\":\"" + field(targetSession, "refreshToken") + "\"}")
				.andExpect(status().isUnauthorized());
		assertThat(jdbc.sql("select user_type from identity.user_account where id = cast(:id as uuid)")
				.param("id", targetId).query(String.class).single()).isEqualTo("landlord");
	}

	@Test
	void roleClaimInTokenMatchesDatabaseAfterNextLogin() throws Exception {
		String admin = field(adminLogin(), "accessToken");
		String targetPhone = newAccount();
		String targetId = idOf(targetPhone);
		putRoles(targetId, "{\"roles\":[\"AGENT\"]}", admin).andExpect(status().isNoContent());

		String token = field(login(targetPhone), "accessToken");

		assertThat(jwt.parse(token).roles()).containsExactly("AGENT");
		mvc.perform(get("/api/v1/auth/me").header("Authorization", "Bearer " + token))
				.andExpect(status().isOk()).andExpect(jsonPath("$.roles[0]").value("AGENT"));
	}

	@Test
	void tenantCannotCallTheAdminEndpoint() throws Exception {
		String phone = newAccount();
		String tenant = field(login(phone), "accessToken");

		putRoles(UUID.randomUUID().toString(), "{\"roles\":[\"ADMIN\"]}", tenant)
				.andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("FORBIDDEN"));
	}

	@Test
	void anonymousCallIs401() throws Exception {
		putRoles(UUID.randomUUID().toString(), "{\"roles\":[\"ADMIN\"]}", null).andExpect(status().isUnauthorized());
	}

	@Test
	void unknownRoleCodeEmptyListAndBadIdAreValidationErrors() throws Exception {
		String admin = field(adminLogin(), "accessToken");
		String targetId = idOf(newAccount());

		putRoles(targetId, "{\"roles\":[\"SUPERUSER\"]}", admin).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		putRoles(targetId, "{\"roles\":[]}", admin).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		putRoles("not-a-uuid", "{\"roles\":[\"TENANT\"]}", admin).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void unknownUserIs404() throws Exception {
		String admin = field(adminLogin(), "accessToken");

		putRoles(UUID.randomUUID().toString(), "{\"roles\":[\"TENANT\"]}", admin).andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
	}

	@Test
	void adminCannotRemoveOwnAdminRoleButCanKeepIt() throws Exception {
		String adminLogin = adminLogin();
		String admin = field(adminLogin, "accessToken");
		String adminId = jwt.parse(admin).userId().toString();

		putRoles(adminId, "{\"roles\":[\"TENANT\"]}", admin).andExpect(status().isForbidden());
		assertThat(rolesOf(adminId)).contains("ADMIN");

		putRoles(adminId, "{\"roles\":[\"ADMIN\",\"TENANT\"]}", admin).andExpect(status().isNoContent());
		postJson("/api/v1/auth/refresh", "{\"refreshToken\":\"" + field(adminLogin, "refreshToken") + "\"}")
				.andExpect(status().isOk());
	}

}
