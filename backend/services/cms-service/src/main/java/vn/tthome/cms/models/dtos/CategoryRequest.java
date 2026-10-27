package vn.tthome.cms.models.dtos;

import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CategoryRequest(@NotNull @Pattern(regexp = "vi|en") String locale, UUID parentId, @NotBlank @Size(max = 200) String name, @NotBlank @Size(max = 200) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String slug, @NotNull @Min(0) @Max(32000) Short sortOrder) {
}
