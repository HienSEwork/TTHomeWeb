package vn.tthome.crm.models.dtos;

import java.util.Map;

/**
 * Customers created in a period (by where they came from and the stage they are in now) and the consultation
 * requests received in it (by status).
 */
public record CustomerStats(long newCustomers, Map<String, Long> bySource, Map<String, Long> byStage,
		long newConsultRequests, Map<String, Long> consultRequestsByStatus) {
}
