package vn.tthome.cms.repos.post;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.Post;

public interface PostRepository extends JpaRepository<Post, UUID>, PostRepositoryCustom {

	Optional<Post> findByIdAndDeletedAtIsNull(UUID id);

	/** Slugs are unique per language among all posts, deleted ones included (database constraint). */
	boolean existsByLocaleAndSlug(String locale, String slug);

	boolean existsByLocaleAndSlugAndIdNot(String locale, String slug, UUID id);

	/** A translation group holds at most one post per language. */
	boolean existsByTranslationGroupIdAndLocale(UUID translationGroupId, String locale);

}
