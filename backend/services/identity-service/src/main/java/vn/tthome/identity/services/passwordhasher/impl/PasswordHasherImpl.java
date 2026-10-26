package vn.tthome.identity.services.passwordhasher.impl;

import java.nio.charset.StandardCharsets;

import org.springframework.stereotype.Service;

import de.mkammerer.argon2.Argon2;
import de.mkammerer.argon2.Argon2Factory;
import de.mkammerer.argon2.Argon2Factory.Argon2Types;
import vn.tthome.identity.services.passwordhasher.PasswordHasher;

@Service
public class PasswordHasherImpl implements PasswordHasher {

	private static final int ITERATIONS = 2;
	private static final int MEMORY_KIB = 19 * 1024;
	private static final int PARALLELISM = 1;

	private final Argon2 argon2 = Argon2Factory.create(Argon2Types.ARGON2id);
	private final String dummyHash = hash("dummy-password-for-timing");

	@Override
	public String hash(String raw) {
		char[] chars = raw.toCharArray();
		try {
			return argon2.hash(ITERATIONS, MEMORY_KIB, PARALLELISM, chars, StandardCharsets.UTF_8);
		} finally {
			argon2.wipeArray(chars);
		}
	}

	@Override
	public boolean verify(String hash, String raw) {
		char[] chars = raw.toCharArray();
		try {
			return argon2.verify(hash, chars, StandardCharsets.UTF_8);
		} finally {
			argon2.wipeArray(chars);
		}
	}

	@Override
	public void verifyDummy(String raw) {
		verify(dummyHash, raw);
	}

}
