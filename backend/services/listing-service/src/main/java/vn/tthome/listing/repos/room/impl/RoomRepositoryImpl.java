package vn.tthome.listing.repos.room.impl;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.hibernate.query.NativeQuery;
import org.hibernate.type.StandardBasicTypes;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.TypedQuery;
import vn.tthome.listing.models.entities.Room;
import vn.tthome.listing.repos.room.RoomRepositoryCustom;

public class RoomRepositoryImpl implements RoomRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Room> search(UUID projectId, String status, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where r.deletedAt is null and r.projectId = :projectId");
		Map<String, Object> params = new HashMap<>();
		params.put("projectId", projectId);
		if (status != null) {
			where.append(" and r.status = :status");
			params.put("status", status);
		}
		if (text != null) {
			where.append(" and (lower(r.code) like :text escape '!' or lower(r.title) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(r) from Room r" + where, Long.class);
		TypedQuery<Room> rows = em.createQuery("select r from Room r" + where + " order by r.code, r.id", Room.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Room> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional
	public void recordHistory(UUID roomId, String status, BigDecimal price, String source) {
		// The price may be null, and an untyped null would be bound as bytea, so its type is stated.
		em.createNativeQuery("insert into inventory.room_status_history (room_id, status, price, source)"
				+ " values (:roomId, :status, :price, :source)").unwrap(NativeQuery.class)
				.setParameter("roomId", roomId).setParameter("status", status)
				.setParameter("price", price, StandardBasicTypes.BIG_DECIMAL).setParameter("source", source)
				.executeUpdate();
	}

	@Override
	@Transactional(readOnly = true)
	public vn.tthome.listing.models.dtos.InventoryStats inventory() {
		Object[] row = (Object[]) em.createNativeQuery("select (select count(*) from inventory.project where deleted_at is null),"
				+ " count(*), count(*) filter (where status = 'available'), count(*) filter (where status = 'reserved'),"
				+ " count(*) filter (where status = 'rented'), count(*) filter (where status = 'hidden')"
				+ " from inventory.room where deleted_at is null").getSingleResult();
		return new vn.tthome.listing.models.dtos.InventoryStats(((Number) row[0]).longValue(), ((Number) row[1]).longValue(),
				((Number) row[2]).longValue(), ((Number) row[3]).longValue(), ((Number) row[4]).longValue(),
				((Number) row[5]).longValue());
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
