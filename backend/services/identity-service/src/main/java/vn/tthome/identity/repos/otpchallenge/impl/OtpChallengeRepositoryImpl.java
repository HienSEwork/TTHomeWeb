package vn.tthome.identity.repos.otpchallenge.impl;

import java.net.InetAddress;
import java.time.Instant;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import vn.tthome.identity.repos.otpchallenge.OtpChallengeRepositoryCustom;

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

	@Override
	@Transactional
	public boolean consumeIfOpen(UUID id, Instant now) {
		return em.createNativeQuery(
				"update identity.otp_challenge set consumed_at = :now where id = :id and consumed_at is null")
				.setParameter("now", now)
				.setParameter("id", id)
				.executeUpdate() == 1;
	}

	@Override
	@Transactional
	public boolean takeAttempt(UUID id, int max) {
		return em.createNativeQuery(
				"update identity.otp_challenge set attempts = attempts + 1 where id = :id and attempts < :max")
				.setParameter("id", id)
				.setParameter("max", max)
				.executeUpdate() == 1;
	}

}
