package vn.tthome.identity.repos;

import java.net.InetAddress;
import java.time.Instant;

public interface OtpChallengeRepositoryCustom {

	/** Number of challenges created for the target since the given instant (uses otp_target_idx). */
	long countRecentByTarget(String target, Instant since);

	/** Number of challenges created from the IP since the given instant (uses otp_ip_idx, migration V2). */
	long countRecentByIp(InetAddress ip, Instant since);

}
