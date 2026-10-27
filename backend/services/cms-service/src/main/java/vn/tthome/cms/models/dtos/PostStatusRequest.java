package vn.tthome.cms.models.dtos;

import java.time.Instant;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** Publishes, schedules, archives or returns an article to draft without touching its text. */
public record PostStatusRequest(@NotNull @Pattern(regexp = "draft|scheduled|published|archived") String status,
		Instant publishedAt) {
}
