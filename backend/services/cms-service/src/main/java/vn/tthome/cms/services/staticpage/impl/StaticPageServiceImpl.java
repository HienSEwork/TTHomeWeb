package vn.tthome.cms.services.staticpage.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.cms.models.dtos.StaticPageRequest;
import vn.tthome.cms.models.dtos.StaticPageResponse;
import vn.tthome.cms.models.entities.StaticPage;
import vn.tthome.cms.repos.staticpage.StaticPageRepository;
import vn.tthome.cms.services.htmlsanitizer.HtmlSanitizer;
import vn.tthome.cms.services.staticpage.StaticPageService;
import vn.tthome.common.error.ApiException;

@Service
public class StaticPageServiceImpl implements StaticPageService {

	private final StaticPageRepository pages;
	private final HtmlSanitizer sanitizer;

	public StaticPageServiceImpl(StaticPageRepository pages, HtmlSanitizer sanitizer) {
		this.pages = pages;
		this.sanitizer = sanitizer;
	}

	@Override
	@Transactional(readOnly = true)
	public List<StaticPageResponse> list(String locale, String status) {
		return pages.search(blank(locale), blank(status)).stream().map(StaticPageResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public StaticPageResponse get(UUID id) {
		return StaticPageResponse.from(find(id));
	}

	@Override
	@Transactional
	public StaticPageResponse create(StaticPageRequest request) {
		UUID group = request.translationGroupId() == null ? UUID.randomUUID() : request.translationGroupId();
		if (pages.existsByLocaleAndSlug(request.locale(), request.slug())) {
			throw conflict("The slug is already used in this language");
		}
		if (pages.existsByTranslationGroupIdAndLocale(group, request.locale())) {
			throw conflict("The translation group already has a page in this language");
		}
		StaticPage page = new StaticPage();
		page.setId(UUID.randomUUID());
		page.setTranslationGroupId(group);
		page.setLocale(request.locale());
		apply(page, request);
		return StaticPageResponse.from(pages.saveAndFlush(page));
	}

	@Override
	@Transactional
	public StaticPageResponse update(UUID id, StaticPageRequest request) {
		StaticPage page = find(id);
		if (!page.getLocale().equals(request.locale())
				|| (request.translationGroupId() != null && !page.getTranslationGroupId().equals(request.translationGroupId()))) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR",
					"The language and the translation group of a page cannot change");
		}
		if (pages.existsByLocaleAndSlugAndIdNot(page.getLocale(), request.slug(), id)) {
			throw conflict("The slug is already used in this language");
		}
		apply(page, request);
		return StaticPageResponse.from(pages.saveAndFlush(page));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		pages.delete(find(id));
		pages.flush();
	}

	private void apply(StaticPage page, StaticPageRequest r) {
		page.setSlug(r.slug());
		page.setTitle(r.title().strip());
		page.setContent(sanitizer.clean(r.content()));
		page.setStatus(r.status());
	}

	private StaticPage find(UUID id) {
		return pages.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Page not found"));
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
