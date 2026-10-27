package vn.tthome.listing.models.dtos;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/** The editable fields of a room; its status is changed through the availability endpoint. */
public record RoomRequest(@NotBlank @Size(max = 50) String code, @NotBlank @Size(max = 200) String title,
		@NotNull @Pattern(regexp = "studio|duplex|1pn|2pn|3pn|shared|dorm|room") String roomType,
		@Min(-5) @Max(200) Short floor, @DecimalMin("0.1") @DecimalMax("9999.9") BigDecimal areaM2,
		@PositiveOrZero Long price, Boolean priceInclUtility, @PositiveOrZero Long deposit,
		@Pattern(regexp = "full|basic|none") String furniture, Boolean hasBalcony, Boolean hasWindow,
		@Min(1) @Max(50) Short maxOccupants, LocalDate availableFrom, Boolean promo,
		@Size(max = 500) String promoNote) {
}
