package vn.tthome.cms.services.staticpage;

import java.util.List;
import java.util.UUID;

import vn.tthome.cms.models.dtos.StaticPageRequest;
import vn.tthome.cms.models.dtos.StaticPageResponse;

/** Administration of static pages (about, contact, policies). */
public interface StaticPageService {

	/** The pages that match every given filter (blank filters are ignored), ordered by language and slug. */
	List<StaticPageResponse> list(String locale, String status);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown page. */
	StaticPageResponse get(UUID id);

	/**
	 * Creates a page; the content is sanitized.
	 *
	 * @throws vn.tthome.common.error.ApiException 409 CONFLICT for a slug already used in this language or a
	 *         translation group that already has a page in this language.
	 */
	StaticPageResponse create(StaticPageRequest request);

	/**
	 * Replaces the title, slug, content and status; the language and translation group never change.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a slug already used, 400
	 *         VALIDATION_ERROR when the language or group in the request differs from the stored one.
	 */
	StaticPageResponse update(UUID id, StaticPageRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown page. */
	void delete(UUID id);

}
