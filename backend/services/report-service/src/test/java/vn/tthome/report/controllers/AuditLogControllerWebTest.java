package vn.tthome.report.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;
import vn.tthome.report.models.dtos.AuditEntry;
import vn.tthome.report.models.dtos.AuditRecordRequest;
import vn.tthome.report.services.audit.AuditService;
import vn.tthome.report.support.TestTokens;

@WebMvcTest(AuditLogController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class AuditLogControllerWebTest {

	private static final String PATH = "/api/v1/admin/audit-logs";
	private static final String BODY = "{\"action\":\"PUT /api/v1/admin/rooms/{id}\",\"entityType\":\"rooms\",\"entityId\":\"1\",\"ip\":\"203.0.113.9\"}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	AuditService audit;

	@Test
	void bothEndpointsNeedAnAdminToken() throws Exception {
		mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
		mvc.perform(post(PATH).contentType(MediaType.APPLICATION_JSON).content(BODY)).andExpect(status().isUnauthorized());
		mvc.perform(get(PATH).header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		mvc.perform(post(PATH).header("Authorization", TestTokens.bearer("CONSULTANT")).contentType(MediaType.APPLICATION_JSON).content(BODY))
				.andExpect(status().isForbidden());
		verifyNoInteractions(audit);
	}

	@Test
	void theLineIsRecordedForTheCallerNotForAnyoneNamedInTheBody() throws Exception {
		UUID admin = UUID.randomUUID();

		mvc.perform(post(PATH).header("Authorization", TestTokens.bearerFor(admin, "ADMIN")).contentType(MediaType.APPLICATION_JSON)
				.content(BODY.substring(0, BODY.length() - 1) + ",\"actorId\":\"" + UUID.randomUUID() + "\"}")).andExpect(status().isCreated());

		verify(audit).record(eq(admin), any(AuditRecordRequest.class));
	}

	@Test
	void invalidLinesAreRefused() throws Exception {
		for (String body : List.of("{}", BODY.replace("PUT /api/v1/admin/rooms/{id}", " "), BODY.replace("203.0.113.9", "not an ip"),
				BODY.replace("203.0.113.9", "x".repeat(65)), BODY.replace("rooms", "x".repeat(201)),
				BODY.replace("PUT /api/v1/admin/rooms/{id}", "x".repeat(301)))) {
			mvc.perform(post(PATH).header("Authorization", TestTokens.admin()).contentType(MediaType.APPLICATION_JSON).content(body))
					.andExpect(status().isBadRequest());
		}
		verifyNoInteractions(audit);
	}

	@Test
	void theLogIsListedWithItsFilters() throws Exception {
		UUID actor = UUID.randomUUID();
		Instant from = Instant.parse("2026-06-01T00:00:00Z");
		Instant to = Instant.parse("2026-07-01T00:00:00Z");
		AuditEntry entry = new AuditEntry(UUID.randomUUID(), actor, "203.0.113.9", "PUT /api/v1/admin/rooms/{id}", "rooms", "1", from);
		when(audit.list(null, null, null, null, null, 0, 50)).thenReturn(new PageResponse<>(List.of(entry), 0, 50, 1));
		when(audit.list(actor, "rooms", "put", from, to, 1, 10)).thenReturn(new PageResponse<>(List.of(), 1, 10, 0));

		mvc.perform(get(PATH).header("Authorization", TestTokens.admin())).andExpect(status().isOk())
				.andExpect(jsonPath("$.items[0].action").value("PUT /api/v1/admin/rooms/{id}")).andExpect(jsonPath("$.items[0].actorIp").value("203.0.113.9"));
		mvc.perform(get(PATH + "?actorId=" + actor + "&entityType=rooms&q=put&from=2026-06-01T00:00:00Z&to=2026-07-01T00:00:00Z&page=1&size=10")
				.header("Authorization", TestTokens.admin())).andExpect(status().isOk());
		for (String query : List.of("actorId=abc", "from=yesterday", "page=-1", "size=0", "size=201", "q=" + "x".repeat(101))) {
			mvc.perform(get(PATH + "?" + query).header("Authorization", TestTokens.admin())).andExpect(status().isBadRequest());
		}
	}

}
