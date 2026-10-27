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
import vn.tthome.cms.models.dtos.StaticPageRequest;
import vn.tthome.cms.models.dtos.StaticPageResponse;
import vn.tthome.cms.services.staticpage.StaticPageService;

@RestController
@RequestMapping("/api/v1/admin/cms/pages")
@PreAuthorize("hasRole('ADMIN')")
public class StaticPageController {

	private final StaticPageService pages;

	public StaticPageController(StaticPageService pages) {
		this.pages = pages;
	}

	@GetMapping
	public List<StaticPageResponse> list(@RequestParam(required = false) String locale,
			@RequestParam(required = false) String status) {
		return pages.list(locale, status);
	}

	@GetMapping("/{id}")
	public StaticPageResponse get(@PathVariable UUID id) {
		return pages.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public StaticPageResponse create(@Valid @RequestBody StaticPageRequest body) {
		return pages.create(body);
	}

	@PutMapping("/{id}")
	public StaticPageResponse update(@PathVariable UUID id, @Valid @RequestBody StaticPageRequest body) {
		return pages.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		pages.delete(id);
	}

}
