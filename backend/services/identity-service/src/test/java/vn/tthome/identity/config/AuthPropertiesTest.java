package vn.tthome.identity.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Duration;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.bind.Binder;
import org.springframework.boot.context.properties.source.MapConfigurationPropertySource;

import jakarta.validation.Validation;
import jakarta.validation.Validator;

class AuthPropertiesTest {

	private static final String LONG_SECRET = "0123456789abcdef0123456789abcdef";
	private static final String LONG_PEPPER = "0123456789abcdef";

	private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

	private AuthProperties bind(String secret, String pepper) {
		MapConfigurationPropertySource source = new MapConfigurationPropertySource(
				Map.of("tthome.auth.jwt-secret", secret, "tthome.auth.otp-pepper", pepper));
		return new Binder(source).bind("tthome.auth", AuthProperties.class).get();
	}

	@Test
	void rejectsJwtSecretShorterThan32Bytes() {
		assertThat(validator.validate(bind("short-secret", LONG_PEPPER))).isNotEmpty();
	}

	@Test
	void rejectsOtpPepperShorterThan16Bytes() {
		assertThat(validator.validate(bind(LONG_SECRET, "short"))).isNotEmpty();
	}

	@Test
	void acceptsValidSecretsWithDefaults() {
		AuthProperties props = bind(LONG_SECRET, LONG_PEPPER);

		assertThat(validator.validate(props)).isEmpty();
		assertThat(props.accessTtl()).isEqualTo(Duration.ofMinutes(15));
		assertThat(props.refreshTtl()).isEqualTo(Duration.ofHours(24));
		assertThat(props.refreshTtlRemember()).isEqualTo(Duration.ofDays(30));
		assertThat(props.maxFailedLogins()).isEqualTo(5);
		assertThat(props.lockDuration()).isEqualTo(Duration.ofMinutes(15));
		assertThat(props.otpTtl()).isEqualTo(Duration.ofMinutes(5));
		assertThat(props.otpMaxAttempts()).isEqualTo(5);
		assertThat(props.otpResendCooldown()).isEqualTo(Duration.ofSeconds(60));
		assertThat(props.otpMaxPerTargetPerHour()).isEqualTo(5);
		assertThat(props.otpMaxPerIpPerHour()).isEqualTo(20);
	}

}
