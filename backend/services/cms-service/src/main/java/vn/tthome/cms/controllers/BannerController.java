package vn.tthome.cms.controllers;

import java.util.List;
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
import vn.tthome.cms.models.dtos.BannerRequest;
import vn.tthome.cms.models.dtos.BannerResponse;
import vn.tthome.cms.services.banner.BannerService;

@RestController
@RequestMapping("/api/v1/admin/cms/banners")
@PreAuthorize("hasRole('ADMIN')")
public class BannerController {

	private final BannerService banners;

	public BannerController(BannerService banners) {
		this.banners = banners;
	}

	@GetMapping
	public List<BannerResponse> list(@RequestParam(required = false) String locale, @RequestParam(required = false) String placement, @RequestParam(required = false) Boolean active) {
		return banners.list(locale, placement, active);
	}

	@GetMapping("/{id}")
	public BannerResponse get(@PathVariable UUID id) {
		return banners.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public BannerResponse create(@Valid @RequestBody BannerRequest body) {
		return banners.create(body);
	}

	@PutMapping("/{id}")
	public BannerResponse update(@PathVariable UUID id, @Valid @RequestBody BannerRequest body) {
		return banners.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		banners.delete(id);
	}

}
