package vn.tthome.listing.models.dtos;

import java.util.UUID;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** The editable fields of a project; its code and slug are generated, and the room counters follow the rooms. */
public record ProjectRequest(@NotBlank @Size(max = 200) String name, @Size(max = 300) String streetAddress,
		Integer wardId, Integer wardNewId, Integer districtId, @DecimalMin("-90") @DecimalMax("90") Double lat,
		@DecimalMin("-180") @DecimalMax("180") Double lng, UUID ownerUserId, UUID managerUserId, boolean exclusive,
		@NotNull @Pattern(regexp = "none|cat|small_pet|ask_owner|allowed") String petPolicy, boolean evParking,
		Boolean freeHours, @Size(max = 500) String maxGuestsNote, @Size(max = 5000) String houseRules,
		@PositiveOrZero Long feeElectric, @PositiveOrZero Long feeWater, @PositiveOrZero Long feeService,
		@PositiveOrZero Long feeParking, @Size(max = 1000) String feeNote, @Size(max = 20000) String description) {
}
