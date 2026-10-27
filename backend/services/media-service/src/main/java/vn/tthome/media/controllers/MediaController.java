package vn.tthome.media.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.common.security.AccessClaims;
import vn.tthome.common.web.PageResponse;
import vn.tthome.media.models.dtos.AssetRequest;
import vn.tthome.media.models.dtos.AssetResponse;
import vn.tthome.media.models.dtos.UploadSignatureRequest;
import vn.tthome.media.models.dtos.UploadSignatureResponse;
import vn.tthome.media.services.asset.AssetService;
import vn.tthome.media.services.uploadsigner.UploadSigner;

@RestController
@RequestMapping("/api/v1/admin/media")
@PreAuthorize("hasRole('ADMIN')")
public class MediaController {

	private final UploadSigner signer;
	private final AssetService assets;

	public MediaController(UploadSigner signer, AssetService assets) {
		this.signer = signer;
		this.assets = assets;
	}

	@PostMapping("/upload-signature")
	public UploadSignatureResponse signUpload(@Valid @RequestBody UploadSignatureRequest body) {
		return signer.sign(body);
	}

	@PostMapping("/assets")
	@ResponseStatus(HttpStatus.CREATED)
	public AssetResponse register(@AuthenticationPrincipal AccessClaims claims, @Valid @RequestBody AssetRequest body) {
		return assets.register(claims.userId(), body);
	}

	@GetMapping("/assets")
	public PageResponse<AssetResponse> list(@RequestParam(required = false) @Size(max = 200) String folder,
			@RequestParam(required = false) @Size(max = 16) String resourceType,
			@RequestParam(required = false) @Size(max = 100) String q, @RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "50") @Min(1) @Max(200) int size) {
		return assets.list(folder, resourceType, q, page, size);
	}

	@GetMapping("/assets/{id}")
	public AssetResponse get(@PathVariable UUID id) {
		return assets.get(id);
	}

	@DeleteMapping("/assets/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		assets.delete(id);
	}

}
