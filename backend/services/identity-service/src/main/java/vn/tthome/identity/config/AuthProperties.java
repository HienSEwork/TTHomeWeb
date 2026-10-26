package vn.tthome.identity.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotBlank;

import java.nio.charset.StandardCharsets;

@Validated
@ConfigurationProperties("tthome.auth")
public record AuthProperties(
		@NotBlank String jwtSecret,
		@NotBlank String otpPepper,
		@DefaultValue("15m") Duration accessTtl,
		@DefaultValue("24h") Duration refreshTtl,
		@DefaultValue("30d") Duration refreshTtlRemember,
		@DefaultValue("5") int maxFailedLogins,
		@DefaultValue("15m") Duration lockDuration,
		@DefaultValue("5m") Duration otpTtl,
		@DefaultValue("5") int otpMaxAttempts,
		@DefaultValue("60s") Duration otpResendCooldown,
		@DefaultValue("5") int otpMaxPerTargetPerHour,
		@DefaultValue("20") int otpMaxPerIpPerHour) {

	@AssertTrue(message = "tthome.auth.jwt-secret must be at least 32 bytes")
	boolean isJwtSecretLongEnough() {
		return jwtSecret != null && jwtSecret.getBytes(StandardCharsets.UTF_8).length >= 32;
	}

	@AssertTrue(message = "tthome.auth.otp-pepper must be at least 16 bytes")
	boolean isOtpPepperLongEnough() {
		return otpPepper != null && otpPepper.getBytes(StandardCharsets.UTF_8).length >= 16;
	}

}
