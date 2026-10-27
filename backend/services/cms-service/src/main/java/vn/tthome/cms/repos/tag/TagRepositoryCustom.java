package vn.tthome.cms.repos.tag;

import java.util.List;

import vn.tthome.cms.models.entities.Tag;

/** Hand-written queries for tags; methods are added when a task needs an optimized query. */
public interface TagRepositoryCustom {

	/** The tags that match every given filter (null filters are ignored), in display order. */
	List<Tag> search(String locale);

}
