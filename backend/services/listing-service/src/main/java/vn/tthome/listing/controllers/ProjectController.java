package vn.tthome.listing.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.ProjectRequest;
import vn.tthome.listing.models.dtos.ProjectResponse;
import vn.tthome.listing.models.dtos.ProjectStatusRequest;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;
import vn.tthome.listing.services.project.ProjectService;

@RestController
@RequestMapping("/api/v1/admin/projects")
@PreAuthorize("hasRole('ADMIN')")
public class ProjectController {

	private final ProjectService projects;

	public ProjectController(ProjectService projects) {
		this.projects = projects;
	}

	@GetMapping
	public PageResponse<ProjectResponse> list(@RequestParam(required = false) @Size(max = 100) String q,
			@RequestParam(required = false) @Size(max = 16) String status,
			@RequestParam(required = false) Integer wardId, @RequestParam(required = false) Integer districtId,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return projects.list(q, status, wardId, districtId, page, size);
	}

	@GetMapping("/{id}")
	public ProjectResponse get(@PathVariable UUID id) {
		return projects.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public ProjectResponse create(@Valid @RequestBody ProjectRequest body) {
		return projects.create(body);
	}

	@PutMapping("/{id}")
	public ProjectResponse update(@PathVariable UUID id, @Valid @RequestBody ProjectRequest body) {
		return projects.update(id, body);
	}

	@PutMapping("/{id}/status")
	public ProjectResponse setStatus(@PathVariable UUID id, @Valid @RequestBody ProjectStatusRequest body) {
		return projects.setStatus(id, body.status());
	}

	@PutMapping("/{id}/amenities")
	public ProjectResponse setAmenities(@PathVariable UUID id, @Valid @RequestBody SetAmenitiesRequest body) {
		return projects.setAmenities(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		projects.delete(id);
	}

}
