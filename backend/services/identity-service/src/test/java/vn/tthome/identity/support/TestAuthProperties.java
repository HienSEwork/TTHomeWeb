package vn.tthome.identity.support;

import java.time.Duration;

import vn.tthome.identity.config.AuthProperties;

public final class TestAuthProperties {

	public static final String SECRET = "test-only-jwt-secret-0123456789-abcdefghij";
	public static final String PEPPER = "test-only-otp-pepper-0123456789";

	private TestAuthProperties() {
	}

	public static AuthProperties defaults() {
		return withSecret(SECRET);
	}

	public static AuthProperties withSecret(String jwtSecret) {
		return new AuthProperties(jwtSecret, PEPPER, Duration.ofMinutes(15), Duration.ofHours(24),
				Duration.ofDays(30), 5, Duration.ofMinutes(15), Duration.ofMinutes(5), 5, Duration.ofSeconds(60), 5,
				20);
	}

}
