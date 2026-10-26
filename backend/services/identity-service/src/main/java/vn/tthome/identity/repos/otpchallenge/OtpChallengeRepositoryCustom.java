package vn.tthome.identity.repos.otpchallenge;

import java.net.InetAddress;
import java.time.Instant;
import java.util.UUID;

public interface OtpChallengeRepositoryCustom {

	/** Number of challenges created for the target since the given instant (uses otp_target_idx). */
	long countRecentByTarget(String target, Instant since);

	/** Number of challenges created from the IP since the given instant (uses otp_ip_idx, migration V2). */
	long countRecentByIp(InetAddress ip, Instant since);

	/** Marks the challenge consumed only if nobody consumed it yet; exactly one concurrent caller gets true. */
	boolean consumeIfOpen(UUID id, Instant now);

	/** Spends one attempt if fewer than max were spent; false means the budget is gone. Exactly max callers win. */
	boolean takeAttempt(UUID id, int max);

}
