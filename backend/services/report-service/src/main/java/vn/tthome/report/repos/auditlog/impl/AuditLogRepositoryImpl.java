package vn.tthome.report.repos.auditlog.impl;

import java.sql.Timestamp;
import java.time.Instant;
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
import jakarta.persistence.Query;
import vn.tthome.report.models.dtos.AuditEntry;
import vn.tthome.report.repos.auditlog.AuditLogRepositoryCustom;

public class AuditLogRepositoryImpl implements AuditLogRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional
	public void record(UUID actorId, String ip, String action, String entityType, String entityId) {
		em.createNativeQuery("insert into report.audit_log (actor_id, actor_ip, action, entity_type, entity_id)"
				+ " values (:actor, cast(nullif(:ip, '') as inet), :action, :type, :entity)").setParameter("actor", actorId)
				.setParameter("ip", ip == null ? "" : ip).setParameter("action", action).setParameter("type", entityType)
				.setParameter("entity", entityId).executeUpdate();
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public Page<AuditEntry> search(UUID actorId, String entityType, String text, Instant from, Instant to, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (actorId != null) {
			where.append(" and actor_id = :actor");
			params.put("actor", actorId);
		}
		if (entityType != null) {
			where.append(" and entity_type = :type");
			params.put("type", entityType);
		}
		if (text != null) {
			where.append(" and lower(action) like :text escape '!'");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		if (from != null) {
			where.append(" and created_at >= :from");
			params.put("from", Timestamp.from(from));
		}
		if (to != null) {
			where.append(" and created_at < :to");
			params.put("to", Timestamp.from(to));
		}
		Query count = em.createNativeQuery("select count(*) from report.audit_log" + where);
		Query rows = em.createNativeQuery("select id, actor_id, host(actor_ip), action, entity_type, entity_id, created_at"
				+ " from report.audit_log" + where + " order by created_at desc, id desc");
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Object[]> result = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize()).getResultList();
		List<AuditEntry> page = result.stream().map(r -> new AuditEntry((UUID) r[0], (UUID) r[1], (String) r[2], (String) r[3],
				(String) r[4], (String) r[5], toInstant(r[6]))).toList();
		return new PageImpl<>(page, pageable, ((Number) count.getSingleResult()).longValue());
	}

	private static Instant toInstant(Object value) {
		return value instanceof Instant i ? i : value instanceof java.time.OffsetDateTime o ? o.toInstant() : ((Timestamp) value).toInstant();
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
