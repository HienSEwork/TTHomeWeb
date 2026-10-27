package vn.tthome.report.models.dtos;

import java.util.Map;

/** What crm-service answers on /api/v1/admin/stats/customers. */
public record CustomerFigures(long newCustomers, Map<String, Long> bySource, Map<String, Long> byStage,
		long newConsultRequests, Map<String, Long> consultRequestsByStatus) {
}
