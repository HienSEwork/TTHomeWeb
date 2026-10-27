package vn.tthome.crm.models.dtos;

import java.time.Instant;
import java.util.UUID;

import vn.tthome.crm.models.entities.CustomerNote;

public record NoteResponse(UUID id, UUID authorId, String body, boolean privateNote, Instant createdAt) {

	public static NoteResponse from(CustomerNote n) {
		return new NoteResponse(n.getId(), n.getAuthorId(), n.getBody(), n.isPrivateNote(), n.getCreatedAt());
	}

}
