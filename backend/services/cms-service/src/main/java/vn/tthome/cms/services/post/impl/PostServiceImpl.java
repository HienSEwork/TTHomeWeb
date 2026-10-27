package vn.tthome.cms.services.post.impl;

import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.cms.commons.Slugs;
import vn.tthome.cms.models.dtos.PostRequest;
import vn.tthome.cms.models.dtos.PostResponse;
import vn.tthome.cms.models.entities.Category;
import vn.tthome.cms.models.entities.Post;
import vn.tthome.cms.models.entities.Tag;
import vn.tthome.cms.repos.category.CategoryRepository;
import vn.tthome.cms.repos.post.PostRepository;
import vn.tthome.cms.repos.tag.TagRepository;
import vn.tthome.cms.services.htmlsanitizer.HtmlSanitizer;
import vn.tthome.cms.services.post.PostService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class PostServiceImpl implements PostService {

	private static final int WORDS_PER_MINUTE = 200;

	private final PostRepository posts;
	private final CategoryRepository categories;
	private final TagRepository tags;
	private final HtmlSanitizer sanitizer;
	private final Clock clock;

	public PostServiceImpl(PostRepository posts, CategoryRepository categories, TagRepository tags,
			HtmlSanitizer sanitizer, Clock clock) {
		this.posts = posts;
		this.categories = categories;
		this.tags = tags;
		this.sanitizer = sanitizer;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<PostResponse> list(String locale, String status, UUID categoryId, String text, int page,
			int size) {
		return PageResponse.of(posts.search(blank(locale), blank(status), categoryId, blank(text), PageRequest.of(page, size)),
				PostResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public PostResponse get(UUID id) {
		return PostResponse.from(find(id));
	}

	@Override
	@Transactional
	public PostResponse create(UUID authorId, PostRequest request) {
		UUID group = request.translationGroupId() == null ? UUID.randomUUID() : request.translationGroupId();
		if (posts.existsByTranslationGroupIdAndLocale(group, request.locale())) {
			throw conflict("The translation group already has a post in this language");
		}
		Post post = new Post();
		post.setId(UUID.randomUUID());
		post.setTranslationGroupId(group);
		post.setLocale(request.locale());
		post.setAuthorId(authorId);
		post.setSlug(slugFor(request, null));
		apply(post, request);
		return PostResponse.from(posts.saveAndFlush(post));
	}

	@Override
	@Transactional
	public PostResponse update(UUID id, PostRequest request) {
		Post post = find(id);
		if (!post.getLocale().equals(request.locale())
				|| (request.translationGroupId() != null && !post.getTranslationGroupId().equals(request.translationGroupId()))) {
			throw invalid("The language and the translation group of a post cannot change");
		}
		if (request.slug() != null && !request.slug().isBlank()) {
			post.setSlug(slugFor(request, id));
		}
		apply(post, request);
		return PostResponse.from(posts.saveAndFlush(post));
	}

	@Override
	@Transactional
	public PostResponse setStatus(UUID id, String status, Instant publishedAt) {
		Post post = find(id);
		applyStatus(post, status, publishedAt);
		return PostResponse.from(posts.saveAndFlush(post));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Post post = find(id);
		post.setDeletedAt(clock.instant());
		posts.saveAndFlush(post);
	}

	private void apply(Post post, PostRequest r) {
		post.setCategoryId(checkCategory(r));
		post.setTags(checkTags(r));
		post.setAuthorName(strip(r.authorName()));
		post.setTitle(r.title().strip());
		post.setExcerpt(strip(r.excerpt()));
		String content = sanitizer.clean(r.content());
		post.setContent(content);
		post.setCoverUrl(r.coverUrl());
		post.setReadMinutes(readMinutes(content));
		applyStatus(post, r.status(), r.publishedAt());
	}

	private void applyStatus(Post post, String status, Instant publishedAt) {
		Instant now = clock.instant();
		switch (status) {
		case "scheduled" -> {
			if (publishedAt == null || !publishedAt.isAfter(now)) {
				throw invalid("A scheduled post needs a publishing time in the future");
			}
			post.setPublishedAt(publishedAt);
		}
		case "published" -> post.setPublishedAt(publishedAt != null ? publishedAt
				: post.getPublishedAt() != null && "published".equals(post.getStatus()) ? post.getPublishedAt() : now);
		default -> {
			if (publishedAt != null) {
				post.setPublishedAt(publishedAt);
			}
		}
		}
		post.setStatus(status);
	}

	private UUID checkCategory(PostRequest r) {
		if (r.categoryId() == null) {
			return null;
		}
		Category category = categories.findById(r.categoryId()).orElseThrow(() -> invalid("Unknown category"));
		if (!category.getLocale().equals(r.locale())) {
			throw invalid("The category must be in the same language");
		}
		return category.getId();
	}

	private Set<Tag> checkTags(PostRequest r) {
		Set<UUID> wanted = new HashSet<>(r.tagIds());
		Map<UUID, Tag> known = tags.findAllById(wanted).stream().collect(Collectors.toMap(Tag::getId, Function.identity()));
		if (!known.keySet().containsAll(wanted)) {
			throw invalid("Unknown tag");
		}
		if (known.values().stream().anyMatch(t -> !t.getLocale().equals(r.locale()))) {
			throw invalid("The tags must be in the same language");
		}
		return new HashSet<>(known.values());
	}

	private String slugFor(PostRequest r, UUID selfId) {
		if (r.slug() != null && !r.slug().isBlank()) {
			boolean taken = selfId == null ? posts.existsByLocaleAndSlug(r.locale(), r.slug())
					: posts.existsByLocaleAndSlugAndIdNot(r.locale(), r.slug(), selfId);
			if (taken) {
				throw conflict("The slug is already used in this language");
			}
			return r.slug();
		}
		String base = Slugs.of(r.title());
		if (base.isEmpty()) {
			base = "post";
		}
		String slug = base;
		for (int n = 2; posts.existsByLocaleAndSlug(r.locale(), slug); n++) {
			slug = base + "-" + n;
		}
		return slug;
	}

	/** Words of the visible text at 200 a minute, at least one minute. */
	static short readMinutes(String html) {
		String text = html.replaceAll("<[^>]*>", " ").strip();
		int words = text.isEmpty() ? 0 : text.split("\\s+").length;
		return (short) Math.min(Short.MAX_VALUE, Math.max(1, (words + WORDS_PER_MINUTE - 1) / WORDS_PER_MINUTE));
	}

	private Post find(UUID id) {
		return posts.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Post not found"));
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String strip(String value) {
		return value == null ? null : value.strip();
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
