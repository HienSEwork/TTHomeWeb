package vn.tthome.identity.repos.useraccount.impl;

import vn.tthome.identity.repos.useraccount.UserAccountRepositoryCustom;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserStatus;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;

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

	@Override
	@Transactional(readOnly = true)
	public Page<UserAccount> search(String text, String phone, String role, UserStatus status, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where u.deletedAt is null");
		Map<String, Object> params = new HashMap<>();
		if (status != null) {
			where.append(" and u.status = :status");
			params.put("status", status);
		}
		if (role != null) {
			where.append(" and exists (select 1 from u.roles r where r.code = :role)");
			params.put("role", role);
		}
		if (text != null) {
			where.append(" and (lower(u.email) like :text escape '!' or lower(u.fullName) like :text escape '!'"
					+ " or u.phone like :text escape '!'");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
			if (phone != null) {
				where.append(" or u.phone = :phone");
				params.put("phone", phone);
			}
			where.append(")");
		}
		TypedQuery<Long> count = em.createQuery("select count(u) from UserAccount u" + where, Long.class);
		TypedQuery<UUID> ids = em.createQuery(
				"select u.id from UserAccount u" + where + " order by u.createdAt desc, u.id desc", UUID.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			ids.setParameter(name, value);
		});
		long total = count.getSingleResult();
		List<UUID> pageIds = ids.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		if (pageIds.isEmpty()) {
			return new PageImpl<>(List.of(), pageable, total);
		}
		Map<UUID, UserAccount> byId = em.createQuery(
				"select distinct u from UserAccount u left join fetch u.roles where u.id in :ids", UserAccount.class)
				.setParameter("ids", pageIds).getResultStream()
				.collect(Collectors.toMap(UserAccount::getId, Function.identity()));
		return new PageImpl<>(pageIds.stream().map(byId::get).toList(), pageable, total);
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
