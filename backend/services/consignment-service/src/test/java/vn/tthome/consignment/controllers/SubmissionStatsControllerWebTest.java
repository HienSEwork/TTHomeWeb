package vn.tthome.consignment.controllers;

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
import vn.tthome.consignment.models.dtos.SubmissionStats;
import vn.tthome.consignment.services.stats.SubmissionStatsService;
import vn.tthome.consignment.support.TestTokens;

@WebMvcTest(SubmissionStatsController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class SubmissionStatsControllerWebTest {

	private static final String PATH = "/api/v1/admin/stats/submissions";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	SubmissionStatsService stats;

	@Test
	void anAdminTokenIsNeededAndTheFiguresAreReturned() throws Exception {
		mvc.perform(get(PATH)).andExpect(status().isUnauthorized());
		mvc.perform(get(PATH).header("Authorization", TestTokens.bearer("LANDLORD"))).andExpect(status().isForbidden());
		verifyNoInteractions(stats);

		when(stats.submissions()).thenReturn(new SubmissionStats(6, Map.of("submitted", 4L, "approved", 2L), 4));
		mvc.perform(get(PATH).header("Authorization", TestTokens.admin())).andExpect(status().isOk()).andExpect(jsonPath("$.total").value(6))
				.andExpect(jsonPath("$.byStatus.submitted").value(4)).andExpect(jsonPath("$.pendingReview").value(4));
	}

}
