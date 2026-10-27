package vn.tthome.listing.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.tthome.listing.models.dtos.MediaLinkResponse;
import vn.tthome.listing.models.dtos.SetMediaRequest;
import vn.tthome.listing.services.medialink.MediaLinkService;

@RestController
@RequestMapping("/api/v1/admin")
@PreAuthorize("hasRole('ADMIN')")
public class MediaLinkController {

	private final MediaLinkService media;

	public MediaLinkController(MediaLinkService media) {
		this.media = media;
	}

	@GetMapping("/projects/{id}/media")
	public List<MediaLinkResponse> ofProject(@PathVariable UUID id) {
		return media.ofProject(id);
	}

	@PutMapping("/projects/{id}/media")
	public List<MediaLinkResponse> replaceForProject(@PathVariable UUID id, @Valid @RequestBody SetMediaRequest body) {
		return media.replaceForProject(id, body);
	}

	@GetMapping("/rooms/{id}/media")
	public List<MediaLinkResponse> ofRoom(@PathVariable UUID id) {
		return media.ofRoom(id);
	}

	@PutMapping("/rooms/{id}/media")
	public List<MediaLinkResponse> replaceForRoom(@PathVariable UUID id, @Valid @RequestBody SetMediaRequest body) {
		return media.replaceForRoom(id, body);
	}

}
