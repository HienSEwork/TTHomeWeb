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
import vn.tthome.cms.models.dtos.CategoryRequest;
import vn.tthome.cms.models.dtos.CategoryResponse;
import vn.tthome.cms.services.category.CategoryService;

@RestController
@RequestMapping("/api/v1/admin/cms/categories")
@PreAuthorize("hasRole('ADMIN')")
public class CategoryController {

	private final CategoryService categorys;

	public CategoryController(CategoryService categorys) {
		this.categorys = categorys;
	}

	@GetMapping
	public List<CategoryResponse> list(@RequestParam(required = false) String locale) {
		return categorys.list(locale);
	}

	@GetMapping("/{id}")
	public CategoryResponse get(@PathVariable UUID id) {
		return categorys.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public CategoryResponse create(@Valid @RequestBody CategoryRequest body) {
		return categorys.create(body);
	}

	@PutMapping("/{id}")
	public CategoryResponse update(@PathVariable UUID id, @Valid @RequestBody CategoryRequest body) {
		return categorys.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		categorys.delete(id);
	}

}
