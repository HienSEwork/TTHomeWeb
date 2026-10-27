package vn.tthome.consignment.repos.submission.impl;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.consignment.models.entities.Submission;
import vn.tthome.consignment.repos.submission.SubmissionRepositoryCustom;

public class SubmissionRepositoryImpl implements SubmissionRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Submission> search(String status, Instant from, Instant to, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (status != null) {
			where.append(" and s.status = :status");
			params.put("status", status);
		}
		if (from != null) {
			where.append(" and s.createdAt >= :from");
			params.put("from", from);
		}
		if (to != null) {
			where.append(" and s.createdAt < :to");
			params.put("to", to);
		}
		if (text != null) {
			where.append(" and (lower(s.code) like :text escape '!' or lower(s.landlordName) like :text escape '!'"
					+ " or s.landlordPhone like :text escape '!' or lower(s.addressText) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(s) from Submission s" + where, Long.class);
		TypedQuery<Submission> rows = em.createQuery(
				"select s from Submission s" + where + " order by s.createdAt, s.id", Submission.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Submission> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public Map<String, Long> countByStatus() {
		List<Object[]> rows = em.createNativeQuery("select status, count(*) from consignment.submission group by status order by status")
				.getResultList();
		Map<String, Long> result = new java.util.LinkedHashMap<>();
		rows.forEach(r -> result.put((String) r[0], ((Number) r[1]).longValue()));
		return result;
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
