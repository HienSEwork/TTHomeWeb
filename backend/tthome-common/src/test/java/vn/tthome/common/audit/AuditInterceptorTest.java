package vn.tthome.common.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CopyOnWriteArrayList;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.AccessTokenParserTest;

/** What the audit interceptor reports for each kind of request, with a recording sender instead of report-service. */
@SpringBootTest(classes = AuditInterceptorTest.TestApp.class, properties = { "tthome.security.jwt-secret=" + AccessTokenParserTest.SECRET,
		"tthome.audit.url=http://unused.invalid" })
@AutoConfigureMockMvc
class AuditInterceptorTest {

	record Sent(String authorization, AuditEvent event) {
	}

	static final List<Sent> SENT = new CopyOnWriteArrayList<>();

	@Configuration
	@EnableAutoConfiguration(excludeName = { "org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration",
			"org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration",
			"org.springframework.boot.amqp.autoconfigure.RabbitAutoConfiguration" })
	@Import({ Controllers.class, GlobalExceptionHandler.class })
	static class TestApp {

		@Bean
		AuditSender recordingSender() {
			return (authorization, event) -> SENT.add(new Sent(authorization, event));
		}

	}

	@RestController
	static class Controllers {

		@PostMapping("/api/v1/admin/cms/posts")
		@ResponseStatus(HttpStatus.CREATED)
		void create() {
		}

		@PutMapping("/api/v1/admin/cms/posts/{id}/status")
		void status(@PathVariable UUID id) {
		}

		@DeleteMapping("/api/v1/admin/rooms/{id}")
		@ResponseStatus(HttpStatus.NO_CONTENT)
		void remove(@PathVariable UUID id) {
		}

		@PutMapping("/api/v1/admin/conflicts/{id}")
		void conflict(@PathVariable UUID id) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "no");
		}

		@GetMapping("/api/v1/admin/cms/posts")
		void list() {
		}

		@PostMapping("/api/v1/other/thing")
		void other() {
		}

		@PostMapping("/api/v1/admin/only-admins")
		@PreAuthorize("hasRole('ADMIN')")
		void onlyAdmins() {
		}

	}

	@Autowired
	MockMvc mvc;

	@BeforeEach
	void clear() {
		SENT.clear();
	}

	private static String bearer(String... roles) {
		return "Bearer " + vn.tthome.common.security.AccessTokenParserTest.token(AccessTokenParserTest.SECRET, UUID.randomUUID(),
				UUID.randomUUID(), List.of(roles), Instant.now().plus(Duration.ofMinutes(5)));
	}

	@Test
	void aCreationIsReportedWithTheRoutePatternAndNoId() throws Exception {
		String token = bearer("ADMIN");

		mvc.perform(post("/api/v1/admin/cms/posts").header("Authorization", token).header("X-Real-IP", "203.0.113.9"))
				.andExpect(status().isCreated());

		assertThat(SENT).hasSize(1);
		assertThat(SENT.get(0).authorization()).isEqualTo(token);
		assertThat(SENT.get(0).event()).isEqualTo(new AuditEvent("POST /api/v1/admin/cms/posts", "cms/posts", null, "203.0.113.9"));
	}

	@Test
	void anUpdateAndADeleteCarryTheEntityIdAndTheResource() throws Exception {
		UUID id = UUID.randomUUID();

		mvc.perform(put("/api/v1/admin/cms/posts/" + id + "/status").header("Authorization", bearer("ADMIN"))).andExpect(status().isOk());
		mvc.perform(delete("/api/v1/admin/rooms/" + id).header("Authorization", bearer("ADMIN"))).andExpect(status().isNoContent());

		assertThat(SENT).extracting(s -> s.event().action()).containsExactly("PUT /api/v1/admin/cms/posts/{id}/status",
				"DELETE /api/v1/admin/rooms/{id}");
		assertThat(SENT).extracting(s -> s.event().entityType()).containsExactly("cms/posts", "rooms");
		assertThat(SENT).extracting(s -> s.event().entityId()).containsOnly(id.toString());
	}

	@Test
	void withoutAGatewayHeaderThePeerAddressIsTheClient() throws Exception {
		mvc.perform(post("/api/v1/admin/cms/posts").header("Authorization", bearer("ADMIN")).with(request -> {
			request.setRemoteAddr("198.51.100.4");
			return request;
		})).andExpect(status().isCreated());

		assertThat(SENT.get(0).event().ip()).isEqualTo("198.51.100.4");
	}

	@Test
	void readsAreNotAudited() throws Exception {
		mvc.perform(get("/api/v1/admin/cms/posts").header("Authorization", bearer("ADMIN"))).andExpect(status().isOk());

		assertThat(SENT).isEmpty();
	}

	@Test
	void failedAndRefusedChangesAreNotAudited() throws Exception {
		mvc.perform(put("/api/v1/admin/conflicts/" + UUID.randomUUID()).header("Authorization", bearer("ADMIN"))).andExpect(status().isConflict());
		mvc.perform(post("/api/v1/admin/only-admins").header("Authorization", bearer("CONSULTANT"))).andExpect(status().isForbidden());
		mvc.perform(post("/api/v1/admin/cms/posts")).andExpect(status().isUnauthorized());

		assertThat(SENT).isEmpty();
	}

	@Test
	void routesOutsideTheAdminAreaAreNotAudited() throws Exception {
		mvc.perform(post("/api/v1/other/thing").header("Authorization", bearer("ADMIN"))).andExpect(status().isOk());

		assertThat(SENT).isEmpty();
	}

	@Test
	void theResourceIsTheRouteUpToItsFirstVariable() {
		assertThat(AuditInterceptor.entityType("/api/v1/admin/cms/posts/{id}/status")).isEqualTo("cms/posts");
		assertThat(AuditInterceptor.entityType("/api/v1/admin/projects/{projectId}/rooms")).isEqualTo("projects");
		assertThat(AuditInterceptor.entityType("/api/v1/admin/users/{id}/roles")).isEqualTo("users");
		assertThat(AuditInterceptor.entityType("/api/v1/admin/media/upload-signature")).isEqualTo("media/upload-signature");
	}

}
