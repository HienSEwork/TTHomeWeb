package vn.tthome.report.services.export.impl;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Map;

import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Service;

import vn.tthome.report.models.dtos.ReportOverview;
import vn.tthome.report.services.export.ExportService;

@Service
public class ExcelExportService implements ExportService {

	private static final String UNAVAILABLE = "unavailable";

	@Override
	public byte[] toExcel(ReportOverview report) {
		try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
			Font bold = workbook.createFont();
			bold.setBold(true);
			CellStyle header = workbook.createCellStyle();
			header.setFont(bold);
			overview(workbook.createSheet("Overview"), header, report);
			traffic(workbook.createSheet("Traffic"), header, report);
			customers(workbook.createSheet("Customers"), header, report);
			rooms(workbook.createSheet("Rooms"), header, report);
			workbook.write(out);
			return out.toByteArray();
		} catch (IOException e) {
			throw new UncheckedIOException(e);
		}
	}

	private static void overview(Sheet sheet, CellStyle header, ReportOverview r) {
		int row = 0;
		row = pair(sheet, row, "From", r.from().toString(), header);
		row = pair(sheet, row, "To", r.to().toString(), header);
		row = pair(sheet, row, "Visitors", number(r.traffic().visitors()), header);
		row = pair(sheet, row, "Page views", number(r.traffic().views()), header);
		row = pair(sheet, row, "Appointments created", r.appointments() == null ? UNAVAILABLE : number(r.appointments().created()), header);
		row = pair(sheet, row, "Booking rate", r.bookingRate() == null ? "n/a" : String.format(java.util.Locale.ROOT, "%.2f%%", r.bookingRate() * 100), header);
		row = pair(sheet, row, "New customers", r.customers() == null ? UNAVAILABLE : number(r.customers().newCustomers()), header);
		row = pair(sheet, row, "Vacant rooms", r.inventory() == null ? UNAVAILABLE : number(r.inventory().vacant()), header);
		pair(sheet, row, "Unavailable services", r.unavailable().isEmpty() ? "none" : String.join(", ", r.unavailable()), header);
		sheet.autoSizeColumn(0);
		sheet.autoSizeColumn(1);
	}

	private static void traffic(Sheet sheet, CellStyle header, ReportOverview r) {
		head(sheet, header, "Day", "Page views");
		int row = 1;
		for (var day : r.traffic().viewsByDay()) {
			Row line = sheet.createRow(row++);
			line.createCell(0).setCellValue(day.day().toString());
			line.createCell(1).setCellValue(day.count());
		}
		row++;
		head(sheet, header, row++, "Event", "Count");
		for (Map.Entry<String, Long> event : r.traffic().eventsByName().entrySet()) {
			Row line = sheet.createRow(row++);
			line.createCell(0).setCellValue(event.getKey());
			line.createCell(1).setCellValue(event.getValue());
		}
		sheet.autoSizeColumn(0);
		sheet.autoSizeColumn(1);
	}

	private static void customers(Sheet sheet, CellStyle header, ReportOverview r) {
		head(sheet, header, "Source", "New customers");
		if (r.customers() == null) {
			sheet.createRow(1).createCell(0).setCellValue(UNAVAILABLE);
			return;
		}
		int row = 1;
		for (Map.Entry<String, Long> source : r.customers().bySource().entrySet()) {
			Row line = sheet.createRow(row++);
			line.createCell(0).setCellValue(source.getKey());
			line.createCell(1).setCellValue(source.getValue());
		}
		sheet.autoSizeColumn(0);
		sheet.autoSizeColumn(1);
	}

	private static void rooms(Sheet sheet, CellStyle header, ReportOverview r) {
		head(sheet, header, "Project", "Rooms", "Vacant", "Occupancy %", "Lowest price");
		if (r.projects() == null) {
			sheet.createRow(1).createCell(0).setCellValue(UNAVAILABLE);
			return;
		}
		int row = 1;
		for (var project : r.projects()) {
			Row line = sheet.createRow(row++);
			line.createCell(0).setCellValue(project.name());
			line.createCell(1).setCellValue(project.totalRooms());
			line.createCell(2).setCellValue(project.vacantCount());
			line.createCell(3).setCellValue(Math.round(project.occupancy() * 1000) / 10.0);
			if (project.minPrice() != null) {
				line.createCell(4).setCellValue(project.minPrice());
			}
		}
		for (int column = 0; column < 5; column++) {
			sheet.autoSizeColumn(column);
		}
	}

	private static int pair(Sheet sheet, int row, String label, String value, CellStyle header) {
		Row line = sheet.createRow(row);
		line.createCell(0).setCellValue(label);
		line.getCell(0).setCellStyle(header);
		line.createCell(1).setCellValue(value);
		return row + 1;
	}

	private static void head(Sheet sheet, CellStyle header, String... titles) {
		head(sheet, header, 0, titles);
	}

	private static void head(Sheet sheet, CellStyle header, int rowIndex, String... titles) {
		Row row = sheet.createRow(rowIndex);
		for (int i = 0; i < titles.length; i++) {
			row.createCell(i).setCellValue(titles[i]);
			row.getCell(i).setCellStyle(header);
		}
	}

	private static String number(long value) {
		return Long.toString(value);
	}

}
