package vn.tthome.cms.repos.staticpage.impl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.cms.models.entities.StaticPage;
import vn.tthome.cms.repos.staticpage.StaticPageRepositoryCustom;

public class StaticPageRepositoryImpl implements StaticPageRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public List<StaticPage> search(String locale, String status) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (locale != null) {
			where.append(" and p.locale = :locale");
			params.put("locale", locale);
		}
		if (status != null) {
			where.append(" and p.status = :status");
			params.put("status", status);
		}
		TypedQuery<StaticPage> query = em.createQuery("select p from StaticPage p" + where + " order by p.locale, p.slug",
				StaticPage.class);
		params.forEach(query::setParameter);
		return query.getResultList();
	}

}
