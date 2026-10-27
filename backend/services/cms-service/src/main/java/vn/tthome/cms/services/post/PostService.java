package vn.tthome.cms.services.post;

import java.util.UUID;

import vn.tthome.cms.models.dtos.PostRequest;
import vn.tthome.cms.models.dtos.PostResponse;
import vn.tthome.common.web.PageResponse;

/** Administration of articles. */
public interface PostService {

	/** One page of posts, newest first; blank filters are ignored. */
	PageResponse<PostResponse> list(String locale, String status, UUID categoryId, String text, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted post. */
	PostResponse get(UUID id);

	/**
	 * Creates a post for the given author. The content is sanitized, the reading time computed, and the slug made
	 * from the title when not given.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for an unknown category or tag, one of another
	 *         language, or a scheduled post without a future time; 409 CONFLICT for a slug already used in this
	 *         language or a translation group that already has a post in it.
	 */
	PostResponse create(UUID authorId, PostRequest request);

	/**
	 * Replaces the text, taxonomy and status. The language, translation group and author never change.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR and 409 CONFLICT as for create,
	 *         400 also when the language or group in the request differs from the stored one.
	 */
	PostResponse update(UUID id, PostRequest request);

	/**
	 * Publishes, schedules, archives or returns the post to draft.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR for a scheduled post without a
	 *         future time.
	 */
	PostResponse setStatus(UUID id, String status, java.time.Instant publishedAt);

	/** Deletes the post (kept in the database, no longer visible; its slug stays taken). */
	void delete(UUID id);

}
