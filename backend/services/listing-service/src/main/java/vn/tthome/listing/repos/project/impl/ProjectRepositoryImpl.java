package vn.tthome.listing.repos.project.impl;

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
import vn.tthome.listing.models.entities.Project;
import vn.tthome.listing.repos.project.ProjectRepositoryCustom;

public class ProjectRepositoryImpl implements ProjectRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Project> search(String text, String status, Integer wardId, Integer districtId, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where p.deletedAt is null");
		Map<String, Object> params = new HashMap<>();
		if (status != null) {
			where.append(" and p.status = :status");
			params.put("status", status);
		}
		if (wardId != null) {
			where.append(" and (p.wardId = :wardId or p.wardNewId = :wardId)");
			params.put("wardId", wardId);
		}
		if (districtId != null) {
			where.append(" and p.districtId = :districtId");
			params.put("districtId", districtId);
		}
		if (text != null) {
			where.append(" and (lower(p.name) like :text escape '!' or lower(p.streetAddress) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(p) from Project p" + where, Long.class);
		TypedQuery<Project> rows = em.createQuery(
				"select p from Project p" + where + " order by p.name, p.id", Project.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Project> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional(readOnly = true)
	public boolean hasRooms(UUID id) {
		return (boolean) em.createNativeQuery(
				"select exists (select 1 from inventory.room where project_id = :id and deleted_at is null)")
				.setParameter("id", id).getSingleResult();
	}

	@Override
	@Transactional
	public void refreshSummary(UUID id) {
		em.createNativeQuery("update inventory.project p set total_rooms = s.total, vacant_count = s.vacant,"
				+ " min_price = s.min_price, room_types = s.types from ("
				+ " select count(*) filter (where status <> 'hidden') as total,"
				+ " count(*) filter (where status = 'available') as vacant,"
				+ " min(price) filter (where status = 'available') as min_price,"
				+ " coalesce(array_agg(distinct room_type order by room_type) filter (where status <> 'hidden'),"
				+ " '{}'::text[]) as types"
				+ " from inventory.room where project_id = :id and deleted_at is null) s where p.id = :id")
				.setParameter("id", id).executeUpdate();
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
