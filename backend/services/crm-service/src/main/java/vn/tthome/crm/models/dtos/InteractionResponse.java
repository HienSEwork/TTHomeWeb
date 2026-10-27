package vn.tthome.crm.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.crm.models.entities.Interaction;

public record InteractionResponse(UUID id, String kind, String direction, String summary, UUID actorId, Instant createdAt) {

	public static InteractionResponse from(Interaction i) {
		return new InteractionResponse(i.getId(), i.getKind(), i.getDirection(), i.getSummary(), i.getActorId(), i.getCreatedAt());
	}

}
