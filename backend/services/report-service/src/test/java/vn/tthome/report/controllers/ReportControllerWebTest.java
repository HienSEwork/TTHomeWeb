package vn.tthome.report.controllers;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.report.models.dtos.ReportOverview;
import vn.tthome.report.models.dtos.TrafficFigures;
import vn.tthome.report.services.export.ExportService;
import vn.tthome.report.services.overview.ReportService;
import vn.tthome.report.support.TestTokens;

@WebMvcTest(ReportController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class ReportControllerWebTest {

	private static final String PATH = "/api/v1/admin/reports/overview";
	private static final Instant FROM = Instant.parse("2026-06-01T00:00:00Z");
	private static final Instant TO = Instant.parse("2026-06-30T00:00:00Z");

	@Autowired
	MockMvc mvc;
	@MockitoBean
	ReportService reports;
	@MockitoBean
	ExportService export;

	private static ReportOverview overview() {
		return new ReportOverview(FROM, TO, new TrafficFigures(5, 9, List.of(), Map.of()), null, null, null, null, null, List.of("crm"));
	}

	@Test
	void bothEndpointsNeedAnAdminToken() throws Exception {
		for (String path : List.of(PATH, PATH + ".xlsx")) {
			mvc.perform(get(path)).andExpect(status().isUnauthorized());
			mvc.perform(get(path).header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(reports, export);
	}

	@Test
	void theOverviewPassesThePeriodAndTheCallersToken() throws Exception {
		String token = TestTokens.admin();
		when(reports.overview(token, null, null)).thenReturn(overview());
		when(reports.overview(token, FROM, TO)).thenReturn(overview());

		mvc.perform(get(PATH).header("Authorization", token)).andExpect(status().isOk()).andExpect(jsonPath("$.traffic.visitors").value(5))
				.andExpect(jsonPath("$.appointments").doesNotExist()).andExpect(jsonPath("$.unavailable[0]").value("crm"));
		mvc.perform(get(PATH + "?from=2026-06-01T00:00:00Z&to=2026-06-30T00:00:00Z").header("Authorization", token)).andExpect(status().isOk());
		verify(reports).overview(token, FROM, TO);
		for (String query : List.of("from=yesterday", "to=2026-13-45")) {
			mvc.perform(get(PATH + "?" + query).header("Authorization", token)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void theExcelFileIsAnAttachmentNamedAfterThePeriod() throws Exception {
		String token = TestTokens.admin();
		when(reports.overview(token, FROM, TO)).thenReturn(overview());
		when(export.toExcel(overview())).thenReturn(new byte[] { 1, 2, 3 });

		mvc.perform(get(PATH + ".xlsx?from=2026-06-01T00:00:00Z&to=2026-06-30T00:00:00Z").header("Authorization", token)).andExpect(status().isOk())
				.andExpect(header().string("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
				.andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("report-2026-06-01_2026-06-30.xlsx")))
				.andExpect(content().bytes(new byte[] { 1, 2, 3 }));
	}

	@Test
	void anInvalidPeriodIsA400OnBothEndpoints() throws Exception {
		String token = TestTokens.admin();
		when(reports.overview(token, TO, FROM)).thenThrow(new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "bad period"));

		mvc.perform(get(PATH + "?from=2026-06-30T00:00:00Z&to=2026-06-01T00:00:00Z").header("Authorization", token)).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		mvc.perform(get(PATH + ".xlsx?from=2026-06-30T00:00:00Z&to=2026-06-01T00:00:00Z").header("Authorization", token)).andExpect(status().isBadRequest());
	}

}
