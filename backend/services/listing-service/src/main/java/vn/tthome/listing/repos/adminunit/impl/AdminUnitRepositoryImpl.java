package vn.tthome.listing.repos.adminunit.impl;

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
import vn.tthome.listing.models.entities.AdminUnit;
import vn.tthome.listing.repos.adminunit.AdminUnitRepositoryCustom;

public class AdminUnitRepositoryImpl implements AdminUnitRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<AdminUnit> search(String scheme, Short level, Integer parentId, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (scheme != null) {
			where.append(" and u.scheme = :scheme");
			params.put("scheme", scheme);
		}
		if (level != null) {
			where.append(" and u.level = :level");
			params.put("level", level);
		}
		if (parentId != null) {
			where.append(" and u.parentId = :parentId");
			params.put("parentId", parentId);
		}
		if (text != null) {
			where.append(" and (lower(u.name) like :text escape '!' or u.slug like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(u) from AdminUnit u" + where, Long.class);
		TypedQuery<AdminUnit> rows = em.createQuery(
				"select u from AdminUnit u" + where + " order by u.level, u.name, u.id", AdminUnit.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<AdminUnit> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isReferenced(int id) {
		return (boolean) em.createNativeQuery("select exists (select 1 from inventory.project"
				+ " where ward_id = :id or ward_new_id = :id or district_id = :id)"
				+ " or exists (select 1 from inventory.admin_unit_map where old_id = :id or new_id = :id)"
				+ " or exists (select 1 from inventory.area_stats where admin_unit_id = :id)")
				.setParameter("id", id).getSingleResult();
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
