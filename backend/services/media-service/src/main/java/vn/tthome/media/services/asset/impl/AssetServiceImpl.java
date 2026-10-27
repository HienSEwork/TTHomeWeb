package vn.tthome.media.services.asset.impl;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;
import vn.tthome.media.config.CloudinaryProperties;
import vn.tthome.media.models.dtos.AssetRequest;
import vn.tthome.media.models.dtos.AssetResponse;
import vn.tthome.media.models.entities.MediaAsset;
import vn.tthome.media.repos.asset.MediaAssetRepository;
import vn.tthome.media.services.asset.AssetService;

@Service
public class AssetServiceImpl implements AssetService {

	private final MediaAssetRepository assets;
	private final CloudinaryProperties cloudinary;

	public AssetServiceImpl(MediaAssetRepository assets, CloudinaryProperties cloudinary) {
		this.assets = assets;
		this.cloudinary = cloudinary;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<AssetResponse> list(String folder, String resourceType, String text, int page, int size) {
		return PageResponse.of(assets.search(blankToNull(folder), blankToNull(resourceType), blankToNull(text),
				PageRequest.of(page, size)), AssetResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public AssetResponse get(UUID id) {
		return AssetResponse.from(find(id));
	}

	@Override
	@Transactional
	public AssetResponse register(UUID uploadedBy, AssetRequest request) {
		if (!cloudinary.configured()) {
			throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MEDIA_UNAVAILABLE", "Uploads are not set up");
		}
		if (!request.secureUrl().startsWith("https://res.cloudinary.com/" + cloudinary.cloudName() + "/")) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "The URL is not a delivery URL of this account");
		}
		if (assets.existsByPublicId(request.publicId())) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The file is already registered");
		}
		MediaAsset asset = new MediaAsset();
		asset.setId(UUID.randomUUID());
		asset.setPublicId(request.publicId());
		asset.setResourceType(request.resourceType());
		asset.setFormat(request.format());
		asset.setBytes(request.bytes());
		asset.setWidth(request.width());
		asset.setHeight(request.height());
		asset.setDurationSec(request.durationSec());
		asset.setCloudVersion(request.version());
		asset.setSecureUrl(request.secureUrl());
		asset.setFolder(request.folder());
		asset.setAltText(request.altText());
		asset.setUploadedBy(uploadedBy);
		return AssetResponse.from(assets.saveAndFlush(asset));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		MediaAsset asset = find(id);
		asset.setDeletedAt(Instant.now());
		assets.saveAndFlush(asset);
	}

	private MediaAsset find(UUID id) {
		return assets.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Asset not found"));
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
