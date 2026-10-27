package vn.tthome.listing.repos.adminunit;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.listing.models.entities.AdminUnit;

public interface AdminUnitRepository extends JpaRepository<AdminUnit, Integer>, AdminUnitRepositoryCustom {

	boolean existsByParentId(Integer parentId);

	boolean existsByIdAndLevelAndScheme(Integer id, Short level, String scheme);

	/** The unique key of a unit; parentId may be null for provinces. */
	boolean existsBySchemeAndParentIdAndSlug(String scheme, Integer parentId, String slug);

	boolean existsBySchemeAndParentIdAndSlugAndIdNot(String scheme, Integer parentId, String slug, Integer id);

}
