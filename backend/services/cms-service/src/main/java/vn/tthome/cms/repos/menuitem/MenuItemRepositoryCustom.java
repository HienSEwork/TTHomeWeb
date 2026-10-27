package vn.tthome.cms.repos.menuitem;

import java.util.List;

import vn.tthome.cms.models.entities.MenuItem;

/** Hand-written queries for menu-items; methods are added when a task needs an optimized query. */
public interface MenuItemRepositoryCustom {

	/** The menu-items that match every given filter (null filters are ignored), in display order. */
	List<MenuItem> search(String locale, String location);

}
