package vn.tthome.cms.repos.banner;

import java.util.List;

import vn.tthome.cms.models.entities.Banner;

/** Hand-written queries for banners; methods are added when a task needs an optimized query. */
public interface BannerRepositoryCustom {

	/** The banners that match every given filter (null filters are ignored), in display order. */
	List<Banner> search(String locale, String placement, Boolean active);

}
