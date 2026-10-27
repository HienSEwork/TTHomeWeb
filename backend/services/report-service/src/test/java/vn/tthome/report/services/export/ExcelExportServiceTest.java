package vn.tthome.report.services.export;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.Test;

import vn.tthome.report.models.dtos.AppointmentFigures;
import vn.tthome.report.models.dtos.CustomerFigures;
import vn.tthome.report.models.dtos.DayCount;
import vn.tthome.report.models.dtos.InventoryFigures;
import vn.tthome.report.models.dtos.ProjectFigures;
import vn.tthome.report.models.dtos.ReportOverview;
import vn.tthome.report.models.dtos.TrafficFigures;
import vn.tthome.report.services.export.impl.ExcelExportService;

class ExcelExportServiceTest {

	private static final Instant FROM = Instant.parse("2026-06-01T00:00:00Z");
	private static final Instant TO = Instant.parse("2026-06-30T00:00:00Z");

	private final ExportService export = new ExcelExportService();

	private static XSSFWorkbook read(byte[] bytes) throws IOException {
		return new XSSFWorkbook(new ByteArrayInputStream(bytes));
	}

	private static String cell(Sheet sheet, int row, int column) {
		return sheet.getRow(row).getCell(column).toString();
	}

	private static ReportOverview full() {
		return new ReportOverview(FROM, TO,
				new TrafficFigures(200, 900, List.of(new DayCount(LocalDate.parse("2026-06-28"), 400), new DayCount(LocalDate.parse("2026-06-29"), 500)),
						Map.of("view", 900L, "click_call", 3L)),
				new AppointmentFigures(10, Map.of("pending", 10L), 4, 6), 0.05,
				new CustomerFigures(8, Map.of("web", 5L, "zalo", 3L), Map.of("new", 8L), 2, Map.of()),
				new InventoryFigures(3, 40, 12, 3, 24, 1), List.of(new ProjectFigures(UUID.randomUUID(), "Green House", 20, 5, 0.75, 3_000_000L)),
				List.of());
	}

	@Test
	void theWorkbookHasTheFourSheetsWithTheFigures() throws Exception {
		try (XSSFWorkbook book = read(export.toExcel(full()))) {
			assertThat(book.getNumberOfSheets()).isEqualTo(4);
			assertThat(book.getSheetName(0)).isEqualTo("Overview");
			assertThat(book.getSheetName(1)).isEqualTo("Traffic");
			assertThat(book.getSheetName(2)).isEqualTo("Customers");
			assertThat(book.getSheetName(3)).isEqualTo("Rooms");

			Sheet overview = book.getSheet("Overview");
			assertThat(cell(overview, 0, 1)).isEqualTo("2026-06-01T00:00:00Z");
			assertThat(cell(overview, 2, 0)).isEqualTo("Visitors");
			assertThat(cell(overview, 2, 1)).isEqualTo("200");
			assertThat(cell(overview, 5, 1)).isEqualTo("5.00%");
			assertThat(cell(overview, 8, 1)).isEqualTo("none");

			Sheet traffic = book.getSheet("Traffic");
			assertThat(cell(traffic, 1, 0)).isEqualTo("2026-06-28");
			assertThat(Double.parseDouble(cell(traffic, 2, 1))).isEqualTo(500.0);

			Sheet customers = book.getSheet("Customers");
			assertThat(cell(customers, 0, 0)).isEqualTo("Source");
			assertThat(customers.getLastRowNum()).isEqualTo(2);

			Sheet rooms = book.getSheet("Rooms");
			assertThat(cell(rooms, 1, 0)).isEqualTo("Green House");
			assertThat(Double.parseDouble(cell(rooms, 1, 3))).isEqualTo(75.0);
			assertThat(Double.parseDouble(cell(rooms, 1, 4))).isEqualTo(3_000_000.0);
		}
	}

	@Test
	void aPartTheServicesCouldNotSupplyIsMarkedUnavailableNotZero() throws Exception {
		ReportOverview partial = new ReportOverview(FROM, TO, new TrafficFigures(0, 0, List.of(), Map.of()), null, null, null, null, null,
				List.of("booking", "crm", "listing"));

		try (XSSFWorkbook book = read(export.toExcel(partial))) {
			Sheet overview = book.getSheet("Overview");
			assertThat(cell(overview, 4, 1)).isEqualTo("unavailable");
			assertThat(cell(overview, 5, 1)).isEqualTo("n/a");
			assertThat(cell(overview, 6, 1)).isEqualTo("unavailable");
			assertThat(cell(overview, 7, 1)).isEqualTo("unavailable");
			assertThat(cell(overview, 8, 1)).isEqualTo("booking, crm, listing");
			assertThat(cell(book.getSheet("Customers"), 1, 0)).isEqualTo("unavailable");
			assertThat(cell(book.getSheet("Rooms"), 1, 0)).isEqualTo("unavailable");
		}
	}

	@Test
	void textThatLooksLikeAFormulaIsStoredAsText() throws Exception {
		ReportOverview report = new ReportOverview(FROM, TO, new TrafficFigures(1, 1, List.of(), Map.of("=HYPERLINK(\"http://evil\")", 1L)),
				null, null, null, null, List.of(new ProjectFigures(UUID.randomUUID(), "=1+1", 1, 1, 0.0, null)), List.of());

		try (XSSFWorkbook book = read(export.toExcel(report))) {
			assertThat(book.getSheet("Rooms").getRow(1).getCell(0).getCellType()).isEqualTo(org.apache.poi.ss.usermodel.CellType.STRING);
			assertThat(book.getSheet("Traffic").getRow(3).getCell(0).getCellType()).isEqualTo(org.apache.poi.ss.usermodel.CellType.STRING);
		}
	}

}
