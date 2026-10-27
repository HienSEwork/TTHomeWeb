package vn.tthome.cms.services.category.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.cms.models.dtos.CategoryRequest;
import vn.tthome.cms.models.dtos.CategoryResponse;
import vn.tthome.cms.models.entities.Category;
import vn.tthome.cms.repos.category.CategoryRepository;
import vn.tthome.cms.services.category.CategoryService;

@Service
public class CategoryServiceImpl implements CategoryService {

	private final CategoryRepository repository;

	public CategoryServiceImpl(CategoryRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<CategoryResponse> list(String locale) {
		return repository.search(blank(locale)).stream().map(CategoryResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public CategoryResponse get(UUID id) {
		return CategoryResponse.from(find(id));
	}

	@Override
	@Transactional
	public CategoryResponse create(CategoryRequest request) {
		Category e = new Category();
		e.setId(UUID.randomUUID());
		check(null, request);
		apply(e, request);
		return CategoryResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public CategoryResponse update(UUID id, CategoryRequest request) {
		Category e = find(id);
		check(e, request);
		apply(e, request);
		return CategoryResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Category e = find(id);
		if (repository.existsByParentId(id) || repository.usedByPosts(id)) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The category still has children or posts");
		}
		repository.delete(e);
		repository.flush();
	}

	private Category find(UUID id) {
		return repository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Category not found"));
	}

	/** Rejects values that do not fit together; current is the stored category on update and null on create. */
	private void check(Category current, CategoryRequest r) {
		boolean taken = current == null ? repository.existsByLocaleAndSlug(r.locale(), r.slug())
				: repository.existsByLocaleAndSlugAndIdNot(r.locale(), r.slug(), current.getId());
		if (taken) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The slug is already used in this language");
		}
		if (r.parentId() == null) {
			return;
		}
		// Walk up from the new parent: reaching the category itself would make a loop.
		UUID cursor = r.parentId();
		for (int depth = 0; cursor != null; depth++) {
			if (depth > 20 || (current != null && cursor.equals(current.getId()))) {
				throw invalid("A category cannot sit under itself");
			}
			Category parent = repository.findById(cursor).orElseThrow(() -> invalid("Unknown parent"));
			if (!parent.getLocale().equals(r.locale())) {
				throw invalid("The parent must be in the same language");
			}
			cursor = parent.getParentId();
		}
	}

	private static void apply(Category e, CategoryRequest r) {
		e.setLocale(r.locale());
		e.setParentId(r.parentId());
		e.setName(r.name().strip());
		e.setSlug(r.slug().strip());
		e.setSortOrder(r.sortOrder());
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static String strip(String value) {
		return value == null ? null : value.strip();
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
