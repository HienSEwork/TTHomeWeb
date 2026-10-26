package vn.tthome.identity.services.contactnormalizer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.services.contactnormalizer.impl.ContactNormalizerImpl;

class ContactNormalizerTest {

	private final ContactNormalizer normalizer = new ContactNormalizerImpl();

	private static void assertValidationError(Runnable call) {
		assertThatThrownBy(call::run).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.code()).isEqualTo("VALIDATION_ERROR");
			assertThat(e.status().value()).isEqualTo(400);
		});
	}

	@Test
	void phoneFormsAllBecomePlus84912345678() {
		assertThat(normalizer.phone("0912345678")).isEqualTo("+84912345678");
		assertThat(normalizer.phone("84912345678")).isEqualTo("+84912345678");
		assertThat(normalizer.phone("+84 912 345 678")).isEqualTo("+84912345678");
		assertThat(normalizer.phone(" 0912-345.678 ")).isEqualTo("+84912345678");
	}

	@Test
	void phoneWithLettersOrWrongLengthIsRejected() {
		assertValidationError(() -> normalizer.phone("09123abc78"));
		assertValidationError(() -> normalizer.phone("091234567"));
		assertValidationError(() -> normalizer.phone("09123456789"));
		assertValidationError(() -> normalizer.phone(""));
		assertValidationError(() -> normalizer.phone(null));
	}

	@Test
	void landlinePrefixIsRejected() {
		assertValidationError(() -> normalizer.phone("0281234567"));
		assertValidationError(() -> normalizer.phone("+842812345678"));
	}

	@Test
	void emailIsTrimmedAndLowerCased() {
		assertThat(normalizer.email(" Foo@Bar.com ")).isEqualTo("foo@bar.com");
	}

	@Test
	void invalidEmailIsRejected() {
		assertValidationError(() -> normalizer.email("no-at-sign"));
		assertValidationError(() -> normalizer.email("a@b"));
		assertValidationError(() -> normalizer.email("two@@at.com"));
		assertValidationError(() -> normalizer.email(" "));
		assertValidationError(() -> normalizer.email(null));
	}

	@Test
	void identifierWithAtSignLooksLikeEmail() {
		assertThat(normalizer.looksLikeEmail("a@b.com")).isTrue();
		assertThat(normalizer.looksLikeEmail("0912345678")).isFalse();
	}

}
