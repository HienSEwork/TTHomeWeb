package vn.tthome.cms.controllers;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import vn.tthome.cms.models.dtos.PostRequest;
import vn.tthome.cms.models.dtos.PostResponse;
import vn.tthome.cms.models.dtos.PostStatusRequest;
import vn.tthome.cms.services.post.PostService;
import vn.tthome.common.security.AccessClaims;
import vn.tthome.common.web.PageResponse;

@RestController
@RequestMapping("/api/v1/admin/cms/posts")
@PreAuthorize("hasRole('ADMIN')")
public class PostController {

	private final PostService posts;

	public PostController(PostService posts) {
		this.posts = posts;
	}

	@GetMapping
	public PageResponse<PostResponse> list(@RequestParam(required = false) @Size(max = 8) String locale,
			@RequestParam(required = false) @Size(max = 16) String status, @RequestParam(required = false) UUID categoryId,
			@RequestParam(required = false) @Size(max = 100) String q, @RequestParam(defaultValue = "0") @Min(0) int page,
			@RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
		return posts.list(locale, status, categoryId, q, page, size);
	}

	@GetMapping("/{id}")
	public PostResponse get(@PathVariable UUID id) {
		return posts.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public PostResponse create(@AuthenticationPrincipal AccessClaims claims, @Valid @RequestBody PostRequest body) {
		return posts.create(claims.userId(), body);
	}

	@PutMapping("/{id}")
	public PostResponse update(@PathVariable UUID id, @Valid @RequestBody PostRequest body) {
		return posts.update(id, body);
	}

	@PutMapping("/{id}/status")
	public PostResponse setStatus(@PathVariable UUID id, @Valid @RequestBody PostStatusRequest body) {
		return posts.setStatus(id, body.status(), body.publishedAt());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		posts.delete(id);
	}

}
