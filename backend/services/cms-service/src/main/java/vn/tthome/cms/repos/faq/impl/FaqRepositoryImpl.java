package vn.tthome.cms.repos.faq.impl;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.cms.models.entities.Faq;
import vn.tthome.cms.repos.faq.FaqRepositoryCustom;

public class FaqRepositoryImpl implements FaqRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public List<Faq> search(String locale, String audience, Boolean active) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (locale != null) {
			where.append(" and e.locale = :locale");
			params.put("locale", locale);
		}
		if (audience != null) {
			where.append(" and e.audience = :audience");
			params.put("audience", audience);
		}
		if (active != null) {
			where.append(" and e.active = :active");
			params.put("active", active);
		}
		TypedQuery<Faq> query = em.createQuery("select e from Faq e" + where + " order by e.audience, e.sortOrder, e.id", Faq.class);
		params.forEach(query::setParameter);
		return query.getResultList();
	}

}
