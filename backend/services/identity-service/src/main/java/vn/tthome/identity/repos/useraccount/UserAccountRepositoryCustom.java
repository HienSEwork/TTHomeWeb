package vn.tthome.identity.repos.useraccount;

import java.time.Instant;
import java.util.UUID;

/** Hand-written queries for user accounts; methods are added when a task needs an optimized query. */
public interface UserAccountRepositoryCustom {

	/**
	 * Counts one wrong password in a single statement and locks the account until lockUntil when the count reaches
	 * threshold. A lock that already expired restarts the count at 1, so one more wrong password after the lock does
	 * not lock again.
	 */
	void recordFailedLogin(UUID id, int threshold, Instant now, Instant lockUntil);

}
