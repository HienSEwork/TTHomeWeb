package vn.tthome.cms.repos.staticpage;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.StaticPage;

public interface StaticPageRepository extends JpaRepository<StaticPage, UUID>, StaticPageRepositoryCustom {

	boolean existsByLocaleAndSlug(String locale, String slug);

	boolean existsByLocaleAndSlugAndIdNot(String locale, String slug, UUID id);

	/** A translation group holds at most one page per language. */
	boolean existsByTranslationGroupIdAndLocale(UUID translationGroupId, String locale);

	boolean existsByTranslationGroupIdAndLocaleAndIdNot(UUID translationGroupId, String locale, UUID id);

}
