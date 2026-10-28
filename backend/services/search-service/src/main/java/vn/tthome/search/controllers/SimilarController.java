package vn.tthome.search.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.tthome.search.models.dtos.ListingItemResponse;
import vn.tthome.search.services.similar.SimilarRoomService;

@RestController
@RequestMapping("/api/v1/rooms")
@Tag(name = "Similar")
public class SimilarController {

	private final SimilarRoomService similar;

	public SimilarController(SimilarRoomService similar) {
		this.similar = similar;
	}

	@GetMapping("/{id}/similar")
	@Operation(summary = "Up to 4 rooms in the same district and type with a price within 20%")
	public List<ListingItemResponse> similar(@PathVariable UUID id) {
		return similar.similar(id);
	}

}
