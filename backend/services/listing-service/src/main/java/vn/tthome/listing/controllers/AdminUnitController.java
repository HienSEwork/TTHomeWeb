package vn.tthome.listing.controllers;

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
import vn.tthome.listing.models.dtos.AdminUnitCreateRequest;
import vn.tthome.listing.models.dtos.AdminUnitResponse;
import vn.tthome.listing.models.dtos.AdminUnitUpdateRequest;
import vn.tthome.listing.services.adminunit.AdminUnitService;

@RestController
@RequestMapping("/api/v1/admin/catalog/areas")
@PreAuthorize("hasRole('ADMIN')")
public class AdminUnitController {

	private final AdminUnitService areas;

	public AdminUnitController(AdminUnitService areas) {
		this.areas = areas;
	}

	@GetMapping
	public PageResponse<AdminUnitResponse> list(@RequestParam(required = false) @Size(max = 16) String scheme,
			@RequestParam(required = false) @Min(1) @Max(3) Short level,
			@RequestParam(required = false) Integer parentId, @RequestParam(required = false) @Size(max = 100) String q,
			@RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "50") @Min(1) @Max(200) int size) {
		return areas.list(scheme, level, parentId, q, page, size);
	}

	@GetMapping("/{id}")
	public AdminUnitResponse get(@PathVariable int id) {
		return areas.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AdminUnitResponse create(@Valid @RequestBody AdminUnitCreateRequest body) {
		return areas.create(body);
	}

	@PutMapping("/{id}")
	public AdminUnitResponse update(@PathVariable int id, @Valid @RequestBody AdminUnitUpdateRequest body) {
		return areas.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable int id) {
		areas.delete(id);
	}

}
