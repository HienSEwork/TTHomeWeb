package vn.tthome.cms.repos.category;

import java.util.List;

import vn.tthome.cms.models.entities.Category;

/** Hand-written queries for categories; methods are added when a task needs an optimized query. */
public interface CategoryRepositoryCustom {

	/** The categories that match every given filter (null filters are ignored), in display order. */
	List<Category> search(String locale);

}
