package vn.tthome.crm.models.dtos;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import vn.tthome.crm.models.entities.ConsultRequest;

public record ConsultRequestResponse(UUID id, UUID customerId, String fullName, String phone, String areaText,
		Long budgetMax, LocalDate moveInDate, String message, String channel, String status, UUID assignedTo,
		Instant createdAt) {

	public static ConsultRequestResponse from(ConsultRequest r) {
		return new ConsultRequestResponse(r.getId(), r.getCustomerId(), r.getFullName(), r.getPhone(), r.getAreaText(),
				r.getBudgetMax() == null ? null : r.getBudgetMax().longValueExact(), r.getMoveInDate(), r.getMessage(),
				r.getChannel(), r.getStatus(), r.getAssignedTo(), r.getCreatedAt());
	}

}
