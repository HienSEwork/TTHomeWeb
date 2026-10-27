package vn.tthome.crm.models.dtos;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * The details of a customer; the name is required and the phone number, when given, is unique among customers. The
 * stage and the owner have their own endpoints.
 */
public record CustomerRequest(@NotBlank @Size(max = 200) String fullName,
		@Pattern(regexp = "\\+?[0-9]{8,15}") String phone, @Email @Size(max = 200) String email,
		@Size(max = 100) String zalo,
		@NotNull @Pattern(regexp = "web|zalo|facebook|tiktok|ctv|meey|hotline|walk_in|other") String source,
		UUID referrerUserId, @NotNull @Min(0) @Max(5) Short priority, Instant nextFollowupAt) {
}
