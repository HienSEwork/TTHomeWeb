package vn.tthome.cms.models.dtos;



import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record FaqRequest(@NotNull @Pattern(regexp = "vi|en") String locale, @NotNull @Pattern(regexp = "tenant|landlord|all") String audience, @NotBlank @Size(max = 500) String question, @NotBlank @Size(max = 10000) String answer, @NotNull @Min(0) @Max(32000) Short sortOrder, Boolean active) {
}
