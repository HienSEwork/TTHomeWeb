package vn.tthome.cms.repos.banner.impl;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.cms.models.entities.Banner;
import vn.tthome.cms.repos.banner.BannerRepositoryCustom;

public class BannerRepositoryImpl implements BannerRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public List<Banner> search(String locale, String placement, Boolean active) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (locale != null) {
			where.append(" and e.locale = :locale");
			params.put("locale", locale);
		}
		if (placement != null) {
			where.append(" and e.placement = :placement");
			params.put("placement", placement);
		}
		if (active != null) {
			where.append(" and e.active = :active");
			params.put("active", active);
		}
		TypedQuery<Banner> query = em.createQuery("select e from Banner e" + where + " order by e.placement, e.sortOrder, e.id", Banner.class);
		params.forEach(query::setParameter);
		return query.getResultList();
	}

}
