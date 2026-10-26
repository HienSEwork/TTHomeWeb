package vn.tthome.identity.repos.useraccount.impl;

import vn.tthome.identity.repos.useraccount.UserAccountRepositoryCustom;

import java.time.Instant;
import java.util.UUID;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

public class UserAccountRepositoryImpl implements UserAccountRepositoryCustom {

	private static final String NEXT_COUNT = "(case when u.locked_until is not null and u.locked_until <= :now"
			+ " then 1 else u.failed_login_count + 1 end)";

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional
	public void recordFailedLogin(UUID id, int threshold, Instant now, Instant lockUntil) {
		em.createNativeQuery("update identity.user_account u set"
				+ " failed_login_count = " + NEXT_COUNT + ","
				+ " locked_until = case when " + NEXT_COUNT + " >= :threshold then :lockUntil"
				+ " when u.locked_until is not null and u.locked_until <= :now then null"
				+ " else u.locked_until end,"
				+ " updated_at = :now"
				+ " where u.id = :id")
				.setParameter("now", now)
				.setParameter("threshold", threshold)
				.setParameter("lockUntil", lockUntil)
				.setParameter("id", id)
				.executeUpdate();
	}

}
