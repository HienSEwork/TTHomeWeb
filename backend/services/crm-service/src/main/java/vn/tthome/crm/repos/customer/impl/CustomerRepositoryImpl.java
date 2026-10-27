package vn.tthome.crm.repos.customer.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;

import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.repos.customer.CustomerRepositoryCustom;

public class CustomerRepositoryImpl implements CustomerRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Customer> search(String stage, UUID ownerUserId, UUID referrerUserId, String source, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where c.deletedAt is null");
		Map<String, Object> params = new HashMap<>();
		if (stage != null) {
			where.append(" and c.stage = :stage");
			params.put("stage", stage);
		}
		if (ownerUserId != null) {
			where.append(" and c.ownerUserId = :owner");
			params.put("owner", ownerUserId);
		}
		if (referrerUserId != null) {
			where.append(" and c.referrerUserId = :referrer");
			params.put("referrer", referrerUserId);
		}
		if (source != null) {
			where.append(" and c.source = :source");
			params.put("source", source);
		}
		if (text != null) {
			where.append(" and (lower(c.fullName) like :text escape '!' or c.phone like :text escape '!'"
					+ " or lower(c.email) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(c) from Customer c" + where, Long.class);
		TypedQuery<Customer> rows = em.createQuery(
				"select c from Customer c" + where + " order by c.createdAt desc, c.id", Customer.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Customer> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public Map<String, Long> countBy(String column, java.time.Instant from, java.time.Instant to) {
		if (!column.equals("source") && !column.equals("stage")) {
			throw new IllegalArgumentException("Cannot count by " + column);
		}
		List<Object[]> rows = em.createNativeQuery("select " + column + ", count(*) from crm.customer where deleted_at is null"
				+ " and created_at >= :from and created_at < :to group by " + column + " order by " + column)
				.setParameter("from", from).setParameter("to", to).getResultList();
		Map<String, Long> result = new java.util.LinkedHashMap<>();
		rows.forEach(r -> result.put((String) r[0], ((Number) r[1]).longValue()));
		return result;
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
