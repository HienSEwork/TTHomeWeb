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
import vn.tthome.listing.models.dtos.AmenityRequest;
import vn.tthome.listing.models.dtos.AmenityResponse;
import vn.tthome.listing.services.amenity.AmenityService;

@RestController
@RequestMapping("/api/v1/admin/catalog/amenities")
@PreAuthorize("hasRole('ADMIN')")
public class AmenityController {

	private final AmenityService amenitys;

	public AmenityController(AmenityService amenitys) {
		this.amenitys = amenitys;
	}

	@GetMapping
	public List<AmenityResponse> list() {
		return amenitys.list();
	}

	@GetMapping("/{id}")
	public AmenityResponse get(@PathVariable short id) {
		return amenitys.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AmenityResponse create(@Valid @RequestBody AmenityRequest body) {
		return amenitys.create(body);
	}

	@PutMapping("/{id}")
	public AmenityResponse update(@PathVariable short id, @Valid @RequestBody AmenityRequest body) {
		return amenitys.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable short id) {
		amenitys.delete(id);
	}

}
