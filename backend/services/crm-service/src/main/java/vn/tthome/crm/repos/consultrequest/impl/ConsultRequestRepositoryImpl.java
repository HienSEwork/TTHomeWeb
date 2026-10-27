package vn.tthome.crm.repos.consultrequest.impl;

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

import vn.tthome.crm.models.entities.ConsultRequest;
import vn.tthome.crm.repos.consultrequest.ConsultRequestRepositoryCustom;

public class ConsultRequestRepositoryImpl implements ConsultRequestRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<ConsultRequest> search(String status, UUID assignedTo, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (status != null) {
			where.append(" and r.status = :status");
			params.put("status", status);
		}
		if (assignedTo != null) {
			where.append(" and r.assignedTo = :assignedTo");
			params.put("assignedTo", assignedTo);
		}
		if (text != null) {
			where.append(" and (lower(r.fullName) like :text escape '!' or r.phone like :text escape '!'"
					+ " or lower(r.message) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(r) from ConsultRequest r" + where, Long.class);
		TypedQuery<ConsultRequest> rows = em.createQuery(
				"select r from ConsultRequest r" + where + " order by r.createdAt desc, r.id", ConsultRequest.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<ConsultRequest> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public Map<String, Long> countByStatus(java.time.Instant from, java.time.Instant to) {
		List<Object[]> rows = em.createNativeQuery("select status, count(*) from crm.consult_request where created_at >= :from"
				+ " and created_at < :to group by status order by status").setParameter("from", from).setParameter("to", to)
				.getResultList();
		Map<String, Long> result = new java.util.LinkedHashMap<>();
		rows.forEach(r -> result.put((String) r[0], ((Number) r[1]).longValue()));
		return result;
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
