package vn.tthome.report.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/** What a service reports about an admin change; who did it is taken from the token that comes with it. */
public record AuditRecordRequest(@NotBlank @Size(max = 300) String action, @Size(max = 200) String entityType,
		@Size(max = 200) String entityId, @Size(max = 64) @Pattern(regexp = "[0-9a-fA-F:.]+") String ip) {
}
