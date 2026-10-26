package vn.tthome.identity.models.dtos;

import java.time.Instant;

public record TokenPair(String accessToken, Instant accessExpiresAt, String refreshToken, Instant refreshExpiresAt) {
}
