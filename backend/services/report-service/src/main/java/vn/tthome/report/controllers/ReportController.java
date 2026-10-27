package vn.tthome.report.controllers;

import java.time.Instant;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import vn.tthome.report.models.dtos.ReportOverview;
import vn.tthome.report.services.export.ExportService;
import vn.tthome.report.services.overview.ReportService;

@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class ReportController {

	static final MediaType XLSX = MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");

	private final ReportService reports;
	private final ExportService export;

	public ReportController(ReportService reports, ExportService export) {
		this.reports = reports;
		this.export = export;
	}

	@GetMapping("/overview")
	public ReportOverview overview(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
		return reports.overview(authorization, from, to);
	}

	@GetMapping("/overview.xlsx")
	public ResponseEntity<byte[]> overviewAsExcel(@RequestHeader(HttpHeaders.AUTHORIZATION) String authorization,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant from,
			@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant to) {
		ReportOverview overview = reports.overview(authorization, from, to);
		String name = "report-" + overview.from().toString().substring(0, 10) + "_" + overview.to().toString().substring(0, 10) + ".xlsx";
		return ResponseEntity.ok().contentType(XLSX)
				.header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(name).build().toString())
				.body(export.toExcel(overview));
	}

}
