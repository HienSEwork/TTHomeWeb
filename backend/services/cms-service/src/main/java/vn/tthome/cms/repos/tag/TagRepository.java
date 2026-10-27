package vn.tthome.cms.repos.tag;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.Tag;

public interface TagRepository extends JpaRepository<Tag, UUID>, TagRepositoryCustom {

	boolean existsByLocaleAndSlug(String locale, String slug);

	boolean existsByLocaleAndSlugAndIdNot(String locale, String slug, UUID id);

	@org.springframework.data.jpa.repository.Query(value = "select exists (select 1 from cms.post_tag where tag_id = :id)",
			nativeQuery = true)
	boolean usedByPosts(@org.springframework.data.repository.query.Param("id") UUID id);

}
