package vn.tthome.cms.repos.category.impl;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.cms.models.entities.Category;
import vn.tthome.cms.repos.category.CategoryRepositoryCustom;

public class CategoryRepositoryImpl implements CategoryRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public List<Category> search(String locale) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (locale != null) {
			where.append(" and e.locale = :locale");
			params.put("locale", locale);
		}
		TypedQuery<Category> query = em.createQuery("select e from Category e" + where + " order by e.sortOrder, e.name, e.id", Category.class);
		params.forEach(query::setParameter);
		return query.getResultList();
	}

}
