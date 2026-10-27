package vn.tthome.report.controllers;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.report.models.dtos.DashboardResponse;
import vn.tthome.report.services.dashboard.DashboardService;
import vn.tthome.report.support.TestTokens;

@WebMvcTest(DashboardController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class DashboardControllerWebTest {

	private static final String PATH = "/api/v1/admin/dashboard";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	DashboardService dashboard;

	@Test
	void anAdminTokenIsNeeded() throws Exception {
		mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
		mvc.perform(get(PATH).header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		verifyNoInteractions(dashboard);
	}

	@Test
	void theCallersTokenIsPassedOnAndTheFiguresReturned() throws Exception {
		String token = TestTokens.admin();
		when(dashboard.dashboard(token, 7)).thenReturn(new DashboardResponse(Instant.parse("2026-06-23T00:00:00Z"),
				Instant.parse("2026-06-30T00:00:00Z"), 12L, 40L, 4L, 2L, null, null, 4L, List.of("crm")));

		mvc.perform(get(PATH).header("Authorization", token)).andExpect(status().isOk()).andExpect(jsonPath("$.vacantRooms").value(12))
				.andExpect(jsonPath("$.newCustomers").doesNotExist()).andExpect(jsonPath("$.unavailable[0]").value("crm"))
				.andExpect(jsonPath("$.pendingConsignments").value(4));
		verify(dashboard).dashboard(token, 7);
	}

	@Test
	void theNumberOfDaysIsBounded() throws Exception {
		String token = TestTokens.admin();
		when(dashboard.dashboard(token, 30)).thenReturn(new DashboardResponse(Instant.now(), Instant.now(), 1L, 1L, 1L, 1L, 1L, 1L, 1L, List.of()));

		mvc.perform(get(PATH + "?days=30").header("Authorization", token)).andExpect(status().isOk());
		for (String days : List.of("0", "91", "-1", "abc")) {
			mvc.perform(get(PATH + "?days=" + days).header("Authorization", token)).andExpect(status().isBadRequest());
		}
	}

}
