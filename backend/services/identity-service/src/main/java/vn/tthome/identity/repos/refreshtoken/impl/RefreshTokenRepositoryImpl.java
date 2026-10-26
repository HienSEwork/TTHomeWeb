package vn.tthome.identity.repos.refreshtoken.impl;

import java.time.Instant;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import vn.tthome.identity.repos.refreshtoken.RefreshTokenRepositoryCustom;

public class RefreshTokenRepositoryImpl implements RefreshTokenRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional
	public int revokeAllActive(UUID userId, Instant now) {
		return em.createNativeQuery(
				"update identity.refresh_token set revoked_at = :now where user_id = :userId and revoked_at is null")
				.setParameter("now", now)
				.setParameter("userId", userId)
				.executeUpdate();
	}

	@Override
	@Transactional
	public boolean revokeIfActive(UUID id, Instant now) {
		return em.createNativeQuery(
				"update identity.refresh_token set revoked_at = :now where id = :id and revoked_at is null")
				.setParameter("now", now)
				.setParameter("id", id)
				.executeUpdate() == 1;
	}

	@Override
	@Transactional
	public int revokeAllActiveExcept(UUID userId, UUID keepId, Instant now) {
		return em.createNativeQuery(
				"update identity.refresh_token set revoked_at = :now"
						+ " where user_id = :userId and revoked_at is null and id <> :keepId")
				.setParameter("now", now)
				.setParameter("userId", userId)
				.setParameter("keepId", keepId)
				.executeUpdate();
	}

}
