package vn.tthome.identity.models.dtos;

import java.util.List;
import java.util.UUID;

public record AccessClaims(UUID userId, UUID sessionId, List<String> roles) {
}
