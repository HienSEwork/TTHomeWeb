package vn.tthome.media.repos.asset;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.media.models.entities.MediaAsset;

/** Hand-written queries for assets; methods are added when a task needs an optimized query. */
public interface MediaAssetRepositoryCustom {

	/**
	 * One page of non-deleted assets, newest first. Every filter is optional (null): folder as a path prefix,
	 * resource type exactly, text as a case-insensitive substring of the public id or alt text.
	 */
	Page<MediaAsset> search(String folder, String resourceType, String text, Pageable pageable);

}
