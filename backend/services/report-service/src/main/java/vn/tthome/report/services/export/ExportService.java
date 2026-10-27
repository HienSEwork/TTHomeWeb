package vn.tthome.report.services.export;

import vn.tthome.report.models.dtos.ReportOverview;

/** Turns a report into a file an admin can open in a spreadsheet. */
public interface ExportService {

	/**
	 * An .xlsx workbook with the sheets Overview, Traffic, Customers and Rooms. A part the services could not supply is
	 * shown as "unavailable" rather than as zero.
	 */
	byte[] toExcel(ReportOverview overview);

}
