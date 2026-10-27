package vn.tthome.cms.repos.staticpage;

import java.util.List;

import vn.tthome.cms.models.entities.StaticPage;

/** Hand-written queries for static pages; methods are added when a task needs an optimized query. */
public interface StaticPageRepositoryCustom {

	/** The pages that match every given filter (null filters are ignored), ordered by language and slug. */
	List<StaticPage> search(String locale, String status);

}
