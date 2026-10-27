package vn.tthome.listing.repos.medialink;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import vn.tthome.listing.models.entities.MediaLink;

public interface MediaLinkRepository extends JpaRepository<MediaLink, UUID>, MediaLinkRepositoryCustom {

	List<MediaLink> findByOwnerTypeAndOwnerIdOrderBySortOrderAsc(String ownerType, UUID ownerId);

	/** Runs at once, so the replacement rows can reuse the unique (owner, asset) pairs. */
	@Modifying
	@Query("delete from MediaLink m where m.ownerType = :ownerType and m.ownerId = :ownerId")
	void deleteAllOf(@Param("ownerType") String ownerType, @Param("ownerId") UUID ownerId);

}
