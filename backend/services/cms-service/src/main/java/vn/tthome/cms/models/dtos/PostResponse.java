package vn.tthome.cms.models.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import vn.tthome.cms.models.entities.Post;
import vn.tthome.cms.models.entities.Tag;

public record PostResponse(UUID id, UUID translationGroupId, String locale, UUID categoryId, UUID authorId,
		String authorName, String title, String slug, String excerpt, String content, String coverUrl,
		Short readMinutes, int viewCount, String status, Instant publishedAt, List<UUID> tagIds) {

	public static PostResponse from(Post p) {
		return new PostResponse(p.getId(), p.getTranslationGroupId(), p.getLocale(), p.getCategoryId(), p.getAuthorId(),
				p.getAuthorName(), p.getTitle(), p.getSlug(), p.getExcerpt(), p.getContent(), p.getCoverUrl(),
				p.getReadMinutes(), p.getViewCount(), p.getStatus(), p.getPublishedAt(),
				p.getTags().stream().map(Tag::getId).sorted().toList());
	}

}
