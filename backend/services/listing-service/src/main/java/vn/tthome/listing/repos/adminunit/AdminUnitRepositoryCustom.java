package vn.tthome.listing.repos.adminunit;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.listing.models.entities.AdminUnit;

/** Hand-written queries for administrative units; methods are added when a task needs an optimized query. */
public interface AdminUnitRepositoryCustom {

	/**
	 * One page of units ordered by level, name and id. Every filter is optional (null): scheme, level and parent
	 * exactly, text as a case-insensitive substring of the name or slug.
	 */
	Page<AdminUnit> search(String scheme, Short level, Integer parentId, String text, Pageable pageable);

	/** True when a project, an old-to-new mapping or the area statistics point at the unit. */
	boolean isReferenced(int id);

}
