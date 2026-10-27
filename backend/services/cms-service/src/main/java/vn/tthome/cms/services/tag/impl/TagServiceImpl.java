package vn.tthome.cms.services.tag.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.cms.models.dtos.TagRequest;
import vn.tthome.cms.models.dtos.TagResponse;
import vn.tthome.cms.models.entities.Tag;
import vn.tthome.cms.repos.tag.TagRepository;
import vn.tthome.cms.services.tag.TagService;

@Service
public class TagServiceImpl implements TagService {

	private final TagRepository repository;

	public TagServiceImpl(TagRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<TagResponse> list(String locale) {
		return repository.search(blank(locale)).stream().map(TagResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public TagResponse get(UUID id) {
		return TagResponse.from(find(id));
	}

	@Override
	@Transactional
	public TagResponse create(TagRequest request) {
		Tag e = new Tag();
		e.setId(UUID.randomUUID());
		check(null, request);
		apply(e, request);
		return TagResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public TagResponse update(UUID id, TagRequest request) {
		Tag e = find(id);
		check(e, request);
		apply(e, request);
		return TagResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Tag e = find(id);
		if (repository.usedByPosts(id)) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "Posts still use the tag");
		}
		repository.delete(e);
		repository.flush();
	}

	private Tag find(UUID id) {
		return repository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Tag not found"));
	}

	/** Rejects values that do not fit together; current is the stored tag on update and null on create. */
	private void check(Tag current, TagRequest r) {
		boolean taken = current == null ? repository.existsByLocaleAndSlug(r.locale(), r.slug())
				: repository.existsByLocaleAndSlugAndIdNot(r.locale(), r.slug(), current.getId());
		if (taken) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The slug is already used in this language");
		}
	}

	private static void apply(Tag e, TagRequest r) {
		e.setLocale(r.locale());
		e.setName(r.name().strip());
		e.setSlug(r.slug().strip());
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
