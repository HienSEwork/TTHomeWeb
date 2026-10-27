package vn.tthome.identity.repos.useraccount.impl;

import vn.tthome.identity.repos.useraccount.UserAccountRepositoryCustom;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import vn.tthome.identity.models.entities.UserAccount;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

public class UserAccountRepositoryImpl implements UserAccountRepositoryCustom {

	private static final String NEXT_COUNT = "(case when u.locked_until is not null and u.locked_until <= :now"
			+ " then 1 else u.failed_login_count + 1 end)";

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Optional<UserAccount> findActiveByEmail(String email) {
		return em.createQuery("select u from UserAccount u where lower(u.email) = :email and u.deletedAt is null",
				UserAccount.class).setParameter("email", email).getResultStream().findFirst();
	}

	@Override
	@Transactional
	public int beginLoginAttempt(UUID id, int threshold, Instant now, Instant lockUntil) {
		return ((Number) em.createNativeQuery("update identity.user_account u set"
				+ " failed_login_count = " + NEXT_COUNT + ","
				+ " locked_until = case when " + NEXT_COUNT + " >= :threshold then :lockUntil"
				+ " when u.locked_until is not null and u.locked_until <= :now then null"
				+ " else u.locked_until end,"
				+ " updated_at = :now"
				+ " where u.id = :id returning u.failed_login_count")
				.setParameter("now", now)
				.setParameter("threshold", threshold)
				.setParameter("lockUntil", lockUntil)
				.setParameter("id", id)
				.getSingleResult()).intValue();
	}

	@Override
	@Transactional
	public void clearLoginAttempts(UUID id, Instant now) {
		em.createNativeQuery("update identity.user_account set failed_login_count = 0, locked_until = null,"
				+ " updated_at = :now where id = :id")
				.setParameter("now", now)
				.setParameter("id", id)
				.executeUpdate();
	}

	@Override
	@Transactional
	public void recordLogin(UUID id, Instant now) {
		em.createNativeQuery("update identity.user_account set last_login_at = :now, failed_login_count = 0,"
				+ " locked_until = null, updated_at = :now where id = :id")
				.setParameter("now", now)
				.setParameter("id", id)
				.executeUpdate();
	}

}
