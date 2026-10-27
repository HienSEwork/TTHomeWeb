package vn.tthome.cms.repos.post;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.cms.models.entities.Post;

/** Hand-written queries for posts; methods are added when a task needs an optimized query. */
public interface PostRepositoryCustom {

	/**
	 * One page of non-deleted posts, newest first (by publishing time, then creation). Every filter is optional
	 * (null): language, status and category exactly, text as a case-insensitive substring of the title.
	 */
	Page<Post> search(String locale, String status, UUID categoryId, String text, Pageable pageable);

}
