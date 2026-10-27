package vn.tthome.cms.repos.menuitem.impl;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.cms.models.entities.MenuItem;
import vn.tthome.cms.repos.menuitem.MenuItemRepositoryCustom;

public class MenuItemRepositoryImpl implements MenuItemRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public List<MenuItem> search(String locale, String location) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (locale != null) {
			where.append(" and e.locale = :locale");
			params.put("locale", locale);
		}
		if (location != null) {
			where.append(" and e.location = :location");
			params.put("location", location);
		}
		TypedQuery<MenuItem> query = em.createQuery("select e from MenuItem e" + where + " order by e.location, e.sortOrder, e.id", MenuItem.class);
		params.forEach(query::setParameter);
		return query.getResultList();
	}

}
