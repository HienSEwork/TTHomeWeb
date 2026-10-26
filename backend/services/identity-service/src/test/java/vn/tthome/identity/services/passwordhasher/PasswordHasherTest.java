package vn.tthome.identity.services.passwordhasher;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;

import org.junit.jupiter.api.Test;

import vn.tthome.identity.services.passwordhasher.impl.PasswordHasherImpl;

class PasswordHasherTest {

	private final PasswordHasher hasher = new PasswordHasherImpl();

	@Test
	void hashIsNotThePasswordAndVerifies() {
		String hash = hasher.hash("correct horse battery");

		assertThat(hash).isNotEqualTo("correct horse battery").startsWith("$argon2id$");
		assertThat(hasher.verify(hash, "correct horse battery")).isTrue();
	}

	@Test
	void wrongPasswordFails() {
		String hash = hasher.hash("correct horse battery");

		assertThat(hasher.verify(hash, "wrong password")).isFalse();
	}

	@Test
	void twoHashesOfSamePasswordDiffer() {
		assertThat(hasher.hash("same-password")).isNotEqualTo(hasher.hash("same-password"));
	}

	@Test
	void verifyDummyNeverThrows() {
		assertThatCode(() -> hasher.verifyDummy("anything at all")).doesNotThrowAnyException();
	}

	@Test
	void unicodePasswordVerifies() {
		String password = "mật-khẩu-Việt-123";

		assertThat(hasher.verify(hasher.hash(password), password)).isTrue();
	}

}
