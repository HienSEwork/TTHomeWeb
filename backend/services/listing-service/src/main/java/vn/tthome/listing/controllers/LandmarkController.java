package vn.tthome.listing.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.tthome.listing.models.dtos.LandmarkRequest;
import vn.tthome.listing.models.dtos.LandmarkResponse;
import vn.tthome.listing.services.landmark.LandmarkService;

@RestController
@RequestMapping("/api/v1/admin/catalog/landmarks")
@PreAuthorize("hasRole('ADMIN')")
public class LandmarkController {

	private final LandmarkService landmarks;

	public LandmarkController(LandmarkService landmarks) {
		this.landmarks = landmarks;
	}

	@GetMapping
	public List<LandmarkResponse> list() {
		return landmarks.list();
	}

	@GetMapping("/{id}")
	public LandmarkResponse get(@PathVariable short id) {
		return landmarks.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public LandmarkResponse create(@Valid @RequestBody LandmarkRequest body) {
		return landmarks.create(body);
	}

	@PutMapping("/{id}")
	public LandmarkResponse update(@PathVariable short id, @Valid @RequestBody LandmarkRequest body) {
		return landmarks.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable short id) {
		landmarks.delete(id);
	}

}
