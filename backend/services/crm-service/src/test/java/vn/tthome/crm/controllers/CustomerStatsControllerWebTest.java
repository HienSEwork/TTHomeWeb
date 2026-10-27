package vn.tthome.crm.controllers;

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

import vn.tthome.crm.models.dtos.CustomerStats;
import vn.tthome.crm.services.stats.CustomerStatsService;
import vn.tthome.crm.support.TestTokens;

@WebMvcTest(CustomerStatsController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class CustomerStatsControllerWebTest {

	private static final String PATH = "/api/v1/admin/stats/customers";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	CustomerStatsService stats;

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
		when(stats.customers(null, null)).thenReturn(new CustomerStats(7, Map.of("web", 5L, "zalo", 2L), Map.of("new", 7L), 3, Map.of("new", 3L)));
		when(stats.customers(Instant.parse("2026-07-01T00:00:00Z"), Instant.parse("2026-08-01T00:00:00Z")))
				.thenReturn(new CustomerStats(0, Map.of(), Map.of(), 0, Map.of()));

		asAdmin(get(PATH)).andExpect(status().isOk()).andExpect(jsonPath("$.newCustomers").value(7)).andExpect(jsonPath("$.bySource.web").value(5))
				.andExpect(jsonPath("$.newConsultRequests").value(3)).andExpect(jsonPath("$.consultRequestsByStatus.new").value(3));
		asAdmin(get(PATH + "?from=2026-07-01T00:00:00Z&to=2026-08-01T00:00:00Z")).andExpect(status().isOk()).andExpect(jsonPath("$.newCustomers").value(0));
		asAdmin(get(PATH + "?from=yesterday")).andExpect(status().isBadRequest());
	}

}
