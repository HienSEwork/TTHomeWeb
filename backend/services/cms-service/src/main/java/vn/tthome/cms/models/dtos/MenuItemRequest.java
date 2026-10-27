package vn.tthome.cms.models.dtos;

import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record MenuItemRequest(@NotNull @Pattern(regexp = "vi|en") String locale, @NotNull @Pattern(regexp = "header|footer_company|footer_connect") String location, UUID parentId, @NotBlank @Size(max = 200) String label, @NotBlank @Size(max = 1000) @Pattern(regexp = "(/\\S*|https://\\S+)") String url, Boolean external, @NotNull @Min(0) @Max(32000) Short sortOrder, Boolean active) {
}
