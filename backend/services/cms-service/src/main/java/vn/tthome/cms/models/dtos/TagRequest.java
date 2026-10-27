package vn.tthome.cms.models.dtos;



import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record TagRequest(@NotNull @Pattern(regexp = "vi|en") String locale, @NotBlank @Size(max = 100) String name, @NotBlank @Size(max = 200) @Pattern(regexp = "[a-z0-9]+(-[a-z0-9]+)*") String slug) {
}
