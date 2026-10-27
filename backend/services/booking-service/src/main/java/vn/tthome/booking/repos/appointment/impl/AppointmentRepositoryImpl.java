package vn.tthome.booking.repos.appointment.impl;

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
import jakarta.persistence.TypedQuery;
import vn.tthome.booking.models.entities.Appointment;
import vn.tthome.booking.repos.appointment.AppointmentRepositoryCustom;

public class AppointmentRepositoryImpl implements AppointmentRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Appointment> search(String status, UUID staffId, UUID projectId, Instant from, Instant to, String text,
			Pageable pageable) {
		StringBuilder where = new StringBuilder(" where 1 = 1");
		Map<String, Object> params = new HashMap<>();
		if (status != null) {
			where.append(" and a.status = :status");
			params.put("status", status);
		}
		if (staffId != null) {
			where.append(" and a.staffId = :staffId");
			params.put("staffId", staffId);
		}
		if (projectId != null) {
			where.append(" and a.projectId = :projectId");
			params.put("projectId", projectId);
		}
		if (from != null) {
			where.append(" and a.scheduledAt >= :from");
			params.put("from", from);
		}
		if (to != null) {
			where.append(" and a.scheduledAt < :to");
			params.put("to", to);
		}
		if (text != null) {
			where.append(" and (lower(a.code) like :text escape '!' or lower(a.contactName) like :text escape '!'"
					+ " or a.contactPhone like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(a) from Appointment a" + where, Long.class);
		TypedQuery<Appointment> rows = em.createQuery(
				"select a from Appointment a" + where + " order by a.scheduledAt, a.id", Appointment.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Appointment> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	@Override
	@Transactional(readOnly = true)
	public boolean staffBusy(UUID staffId, UUID exceptAppointmentId, Instant start, Instant end) {
		return (boolean) em.createNativeQuery("select exists (select 1 from booking.appointment where staff_id = :staff"
				+ " and id <> :except and status in ('pending', 'confirmed', 'rescheduled')"
				+ " and scheduled_at < :end and scheduled_at + make_interval(mins => duration_min) > :start)")
				.setParameter("staff", staffId).setParameter("except", exceptAppointmentId).setParameter("start", start)
				.setParameter("end", end).getSingleResult();
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public Map<String, Long> countByStatusCreatedBetween(Instant from, Instant to) {
		List<Object[]> rows = em.createNativeQuery("select status, count(*) from booking.appointment"
				+ " where created_at >= :from and created_at < :to group by status order by status")
				.setParameter("from", from).setParameter("to", to).getResultList();
		Map<String, Long> result = new java.util.LinkedHashMap<>();
		rows.forEach(r -> result.put((String) r[0], ((Number) r[1]).longValue()));
		return result;
	}

	@Override
	@Transactional(readOnly = true)
	public long countOpenBetween(Instant from, Instant to) {
		return ((Number) em.createNativeQuery("select count(*) from booking.appointment where status in ('pending', 'confirmed',"
				+ " 'rescheduled') and scheduled_at >= :from and scheduled_at < :to").setParameter("from", from)
				.setParameter("to", to).getSingleResult()).longValue();
	}

	@Override
	@Transactional(readOnly = true)
	public long countWithStatus(String status) {
		return ((Number) em.createNativeQuery("select count(*) from booking.appointment where status = :status")
				.setParameter("status", status).getSingleResult()).longValue();
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
