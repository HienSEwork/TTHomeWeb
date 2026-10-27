package vn.tthome.crm.repos.commission.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import vn.tthome.crm.models.dtos.CollaboratorSummary;
import vn.tthome.crm.models.entities.Commission;
import vn.tthome.crm.repos.commission.CommissionRepositoryCustom;

public class CommissionRepositoryImpl implements CommissionRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Commission> search(UUID referrerUserId, UUID customerId, String status, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (referrerUserId != null) {
			where.append(" and c.referrerUserId = :referrer");
			params.put("referrer", referrerUserId);
		}
		if (customerId != null) {
			where.append(" and c.customerId = :customer");
			params.put("customer", customerId);
		}
		if (status != null) {
			where.append(" and c.status = :status");
			params.put("status", status);
		}
		TypedQuery<Long> count = em.createQuery("select count(c) from Commission c" + where, Long.class);
		TypedQuery<Commission> rows = em.createQuery(
				"select c from Commission c" + where + " order by c.createdAt desc, c.id", Commission.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Commission> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public Page<CollaboratorSummary> collaborators(UUID referrerUserId, Pageable pageable) {
		String filter = referrerUserId == null ? "" : " and c.referrer_user_id = :referrer";
		Query count = em.createNativeQuery("select count(distinct c.referrer_user_id) from crm.customer c"
				+ " where c.deleted_at is null and c.referrer_user_id is not null" + filter);
		Query rows = em.createNativeQuery("select c.referrer_user_id, count(distinct c.id) as customers,"
				+ " count(distinct c.id) filter (where c.stage = 'rented') as rented,"
				+ " coalesce(sum(m.amount) filter (where m.status in ('pending', 'approved')), 0) as owed,"
				+ " coalesce(sum(m.amount) filter (where m.status = 'paid'), 0) as paid"
				+ " from crm.customer c left join crm.commission m on m.customer_id = c.id and m.status <> 'cancelled'"
				+ " where c.deleted_at is null and c.referrer_user_id is not null" + filter
				+ " group by c.referrer_user_id order by customers desc, c.referrer_user_id");
		if (referrerUserId != null) {
			count.setParameter("referrer", referrerUserId);
			rows.setParameter("referrer", referrerUserId);
		}
		List<Object[]> result = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		List<CollaboratorSummary> page = result.stream().map(r -> new CollaboratorSummary((UUID) r[0], ((Number) r[1]).longValue(),
				((Number) r[2]).longValue(), ((Number) r[3]).longValue(), ((Number) r[4]).longValue())).toList();
		return new PageImpl<>(page, pageable, ((Number) count.getSingleResult()).longValue());
	}

}
