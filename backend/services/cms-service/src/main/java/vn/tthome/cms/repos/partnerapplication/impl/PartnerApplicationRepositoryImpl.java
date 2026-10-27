package vn.tthome.cms.repos.partnerapplication.impl;

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
import vn.tthome.cms.models.entities.PartnerApplication;
import vn.tthome.cms.repos.partnerapplication.PartnerApplicationRepositoryCustom;

public class PartnerApplicationRepositoryImpl implements PartnerApplicationRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<PartnerApplication> search(String kind, String status, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (kind != null) {
			where.append(" and a.kind = :kind");
			params.put("kind", kind);
		}
		if (status != null) {
			where.append(" and a.status = :status");
			params.put("status", status);
		}
		if (text != null) {
			where.append(" and (lower(a.fullName) like :text escape '!' or a.phone like :text escape '!'"
					+ " or lower(a.email) like :text escape '!' or lower(a.position) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(a) from PartnerApplication a" + where, Long.class);
		TypedQuery<PartnerApplication> rows = em.createQuery(
				"select a from PartnerApplication a" + where + " order by a.createdAt desc, a.id", PartnerApplication.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<PartnerApplication> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
