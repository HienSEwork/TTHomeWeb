package vn.tthome.report.repos.event.impl;

import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import vn.tthome.report.models.dtos.DayCount;
import vn.tthome.report.repos.event.EventRepositoryCustom;

public class EventRepositoryImpl implements EventRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public long visitors(Instant from, Instant to) {
		return ((Number) em.createNativeQuery("select count(distinct session_id) from report.event where created_at >= :from"
				+ " and created_at < :to and session_id is not null").setParameter("from", from).setParameter("to", to)
				.getSingleResult()).longValue();
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public Map<String, Long> countByName(Instant from, Instant to) {
		List<Object[]> rows = em.createNativeQuery("select name, count(*) from report.event where created_at >= :from"
				+ " and created_at < :to group by name order by name").setParameter("from", from).setParameter("to", to)
				.getResultList();
		Map<String, Long> result = new LinkedHashMap<>();
		rows.forEach(r -> result.put((String) r[0], ((Number) r[1]).longValue()));
		return result;
	}

	@Override
	@Transactional(readOnly = true)
	@SuppressWarnings("unchecked")
	public List<DayCount> viewsByDay(Instant from, Instant to) {
		List<Object[]> rows = em.createNativeQuery("select cast(created_at at time zone 'UTC' as date) as day, count(*)"
				+ " from report.event where name = 'view' and created_at >= :from and created_at < :to group by day order by day")
				.setParameter("from", from).setParameter("to", to).getResultList();
		return rows.stream().map(r -> new DayCount(LocalDate.parse(r[0].toString()), ((Number) r[1]).longValue())).toList();
	}

}
