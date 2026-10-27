package vn.tthome.consignment.models.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The reviewer's decision: approve, reject (the note is the reason shown to the landlord) or ask for more
 * information (the note says what is missing). Rejecting and asking need the note; approving may have one.
 */
public record ReviewRequest(@NotNull @Pattern(regexp = "approve|reject|need_info") String decision,
		@Size(max = 2000) String note) {
}
