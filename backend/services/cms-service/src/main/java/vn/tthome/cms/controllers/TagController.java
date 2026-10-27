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
import vn.tthome.cms.models.dtos.TagRequest;
import vn.tthome.cms.models.dtos.TagResponse;
import vn.tthome.cms.services.tag.TagService;

@RestController
@RequestMapping("/api/v1/admin/cms/tags")
@PreAuthorize("hasRole('ADMIN')")
public class TagController {

	private final TagService tags;

	public TagController(TagService tags) {
		this.tags = tags;
	}

	@GetMapping
	public List<TagResponse> list(@RequestParam(required = false) String locale) {
		return tags.list(locale);
	}

	@GetMapping("/{id}")
	public TagResponse get(@PathVariable UUID id) {
		return tags.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public TagResponse create(@Valid @RequestBody TagRequest body) {
		return tags.create(body);
	}

	@PutMapping("/{id}")
	public TagResponse update(@PathVariable UUID id, @Valid @RequestBody TagRequest body) {
		return tags.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		tags.delete(id);
	}

}
