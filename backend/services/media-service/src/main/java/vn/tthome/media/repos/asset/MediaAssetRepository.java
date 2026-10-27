package vn.tthome.media.repos.asset;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.media.models.entities.MediaAsset;

public interface MediaAssetRepository extends JpaRepository<MediaAsset, UUID>, MediaAssetRepositoryCustom {

	Optional<MediaAsset> findByIdAndDeletedAtIsNull(UUID id);

	/** The Cloudinary public id is unique among all assets, deleted ones included (database constraint). */
	boolean existsByPublicId(String publicId);

}
