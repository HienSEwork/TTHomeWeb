package vn.tthome.listing.controllers;

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
import java.util.UUID;

import vn.tthome.listing.models.dtos.InventoryStats;
import vn.tthome.listing.models.dtos.ProjectPerformance;
import vn.tthome.listing.services.stats.InventoryStatsService;
import vn.tthome.listing.support.TestTokens;

@WebMvcTest(InventoryStatsController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class InventoryStatsControllerWebTest {

	@Autowired
	MockMvc mvc;
	@MockitoBean
	InventoryStatsService stats;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	@Test
	void bothEndpointsNeedAnAdminToken() throws Exception {
		for (String path : List.of("/api/v1/admin/stats/inventory", "/api/v1/admin/stats/projects")) {
			mvc.perform(get(path)).andExpect(status().isUnauthorized());
			mvc.perform(get(path).header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(stats);
	}

	@Test
	void theFiguresAreReturned() throws Exception {
		when(stats.inventory()).thenReturn(new InventoryStats(3, 40, 12, 3, 24, 1));
		when(stats.projects(10)).thenReturn(List.of(new ProjectPerformance(UUID.randomUUID(), "Green", 20, 5, 0.75, 3_000_000L)));

		asAdmin(get("/api/v1/admin/stats/inventory")).andExpect(status().isOk()).andExpect(jsonPath("$.vacant").value(12))
				.andExpect(jsonPath("$.projects").value(3)).andExpect(jsonPath("$.hidden").value(1));
		asAdmin(get("/api/v1/admin/stats/projects")).andExpect(status().isOk()).andExpect(jsonPath("$[0].occupancy").value(0.75))
				.andExpect(jsonPath("$[0].minPrice").value(3000000));
		for (String size : List.of("0", "51", "abc")) {
			asAdmin(get("/api/v1/admin/stats/projects?size=" + size)).andExpect(status().isBadRequest());
		}
	}

}
