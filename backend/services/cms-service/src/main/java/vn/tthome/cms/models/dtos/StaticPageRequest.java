package vn.tthome.cms.models.dtos;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The slug may contain "/" for nested pages such as chinh-sach/bao-mat. A translation group links the languages of
 * one page; leave it out for a new page, give the group of the existing page to add a translation.
 */
public record StaticPageRequest(@NotNull @Pattern(regexp = "vi|en") String locale, UUID translationGroupId,
		@NotBlank @Size(max = 200) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*(/[a-z0-9]+(-[a-z0-9]+)*)*") String slug,
		@NotBlank @Size(max = 200) String title, @Size(max = 200000) String content,
		@NotNull @Pattern(regexp = "draft|published") String status) {
}
