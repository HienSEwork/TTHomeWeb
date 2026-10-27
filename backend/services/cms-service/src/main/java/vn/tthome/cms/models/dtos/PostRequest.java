package vn.tthome.cms.models.dtos;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * An article. The slug is made from the title when left out. A scheduled article needs a future publishing time; a
 * published one without a time is published now. A translation group links the languages of one article.
 */
public record PostRequest(@NotNull @Pattern(regexp = "vi|en") String locale, UUID translationGroupId, UUID categoryId,
		@Size(max = 200) String authorName, @NotBlank @Size(max = 300) String title,
		@Size(max = 200) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String slug, @Size(max = 1000) String excerpt,
		@NotBlank @Size(max = 500000) String content, @Size(max = 1000) @Pattern(regexp = "https://\\S+") String coverUrl,
		@NotNull @Pattern(regexp = "draft|scheduled|published|archived") String status, Instant publishedAt,
		@NotNull @Size(max = 20) List<@NotNull UUID> tagIds) {
}
