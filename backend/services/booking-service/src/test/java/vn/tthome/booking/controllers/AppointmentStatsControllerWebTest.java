package vn.tthome.booking.controllers;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import java.time.Instant;

import vn.tthome.booking.models.dtos.AppointmentStats;
import vn.tthome.booking.services.stats.AppointmentStatsService;
import vn.tthome.booking.support.TestTokens;

@WebMvcTest(AppointmentStatsController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class AppointmentStatsControllerWebTest {

	private static final String PATH = "/api/v1/admin/stats/appointments";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	AppointmentStatsService stats;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	@Test
	void anAdminTokenIsNeeded() throws Exception {
		mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
		mvc.perform(get(PATH).header("Authorization", TestTokens.bearer("AGENT"))).andExpect(status().isForbidden());
		verifyNoInteractions(stats);
	}

	@Test
	void thePeriodIsParsedAndTheFiguresReturned() throws Exception {
		when(stats.appointments(null, null)).thenReturn(new AppointmentStats(5, Map.of("pending", 3L, "confirmed", 2L), 4, 3));
		when(stats.appointments(Instant.parse("2026-07-01T00:00:00Z"), Instant.parse("2026-08-01T00:00:00Z")))
				.thenReturn(new AppointmentStats(1, Map.of("pending", 1L), 0, 1));

		asAdmin(get(PATH)).andExpect(status().isOk()).andExpect(jsonPath("$.created").value(5))
				.andExpect(jsonPath("$.createdByStatus.pending").value(3)).andExpect(jsonPath("$.upcomingOpen").value(4))
				.andExpect(jsonPath("$.pendingConfirmation").value(3));
		asAdmin(get(PATH + "?from=2026-07-01T00:00:00Z&to=2026-08-01T00:00:00Z")).andExpect(status().isOk()).andExpect(jsonPath("$.created").value(1));
		for (String query : List.of("from=yesterday", "to=2026-13-45")) {
			asAdmin(get(PATH + "?" + query)).andExpect(status().isBadRequest());
		}
	}

}
