package vn.tthome.identity.repos;

import java.net.InetAddress;
import java.time.Instant;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

public class OtpChallengeRepositoryImpl implements OtpChallengeRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	public long countRecentByTarget(String target, Instant since) {
		return ((Number) em.createNativeQuery(
				"select count(*) from identity.otp_challenge where target = :target and created_at > :since")
				.setParameter("target", target)
				.setParameter("since", since)
				.getSingleResult()).longValue();
	}

	@Override
	public long countRecentByIp(InetAddress ip, Instant since) {
		return ((Number) em.createNativeQuery(
				"select count(*) from identity.otp_challenge where ip = cast(:ip as inet) and created_at > :since")
				.setParameter("ip", ip.getHostAddress())
				.setParameter("since", since)
				.getSingleResult()).longValue();
	}

}
