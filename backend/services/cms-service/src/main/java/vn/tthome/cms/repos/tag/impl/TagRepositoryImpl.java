package vn.tthome.cms.repos.tag.impl;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.cms.models.entities.Tag;
import vn.tthome.cms.repos.tag.TagRepositoryCustom;

public class TagRepositoryImpl implements TagRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public List<Tag> search(String locale) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (locale != null) {
			where.append(" and e.locale = :locale");
			params.put("locale", locale);
		}
		TypedQuery<Tag> query = em.createQuery("select e from Tag e" + where + " order by e.name, e.id", Tag.class);
		params.forEach(query::setParameter);
		return query.getResultList();
	}

}
