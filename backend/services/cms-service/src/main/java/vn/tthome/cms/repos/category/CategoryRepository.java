package vn.tthome.cms.repos.category;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.Category;

public interface CategoryRepository extends JpaRepository<Category, UUID>, CategoryRepositoryCustom {

	boolean existsByLocaleAndSlug(String locale, String slug);

	boolean existsByLocaleAndSlugAndIdNot(String locale, String slug, UUID id);

	boolean existsByParentId(UUID parentId);

	@org.springframework.data.jpa.repository.Query(value = "select exists (select 1 from cms.post where category_id = :id)",
			nativeQuery = true)
	boolean usedByPosts(@org.springframework.data.repository.query.Param("id") UUID id);

}
