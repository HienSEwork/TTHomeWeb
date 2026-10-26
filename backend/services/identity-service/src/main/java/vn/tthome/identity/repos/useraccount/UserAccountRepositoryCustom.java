package vn.tthome.identity.repos.useraccount;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import vn.tthome.identity.models.entities.UserAccount;

/** Hand-written queries for user accounts; methods are added when a task needs an optimized query. */
public interface UserAccountRepositoryCustom {

	/** Finds a non-deleted account by its lower-case email; the predicate matches the lower(email) unique index. */
	Optional<UserAccount> findActiveByEmail(String email);

	/**
	 * Spends one password attempt before the password is checked and returns the attempt number (1-based), so parallel
	 * guesses cannot exceed the budget: a caller whose number is above threshold must be refused without checking.
	 * The account is locked until lockUntil when the number reaches threshold. A lock that already expired restarts
	 * the count at 1.
	 */
	int beginLoginAttempt(UUID id, int threshold, Instant now, Instant lockUntil);

	/** Clears the failed-login counter and any lock. */
	void clearLoginAttempts(UUID id, Instant now);

	/** Stamps the last login and clears the failed-login counter and any lock, without an optimistic-lock check. */
	void recordLogin(UUID id, Instant now);

	/** Marks the email verified if it is not yet, without an optimistic-lock check. */
	void markEmailVerified(UUID id, Instant now);

}
