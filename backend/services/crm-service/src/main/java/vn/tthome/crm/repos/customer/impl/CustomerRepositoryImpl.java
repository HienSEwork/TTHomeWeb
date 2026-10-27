package vn.tthome.crm.repos.customer.impl;

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

import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.repos.customer.CustomerRepositoryCustom;

public class CustomerRepositoryImpl implements CustomerRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Customer> search(String stage, UUID ownerUserId, String source, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where c.deletedAt is null");
		Map<String, Object> params = new HashMap<>();
		if (stage != null) {
			where.append(" and c.stage = :stage");
			params.put("stage", stage);
		}
		if (ownerUserId != null) {
			where.append(" and c.ownerUserId = :owner");
			params.put("owner", ownerUserId);
		}
		if (source != null) {
			where.append(" and c.source = :source");
			params.put("source", source);
		}
		if (text != null) {
			where.append(" and (lower(c.fullName) like :text escape '!' or c.phone like :text escape '!'"
					+ " or lower(c.email) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(c) from Customer c" + where, Long.class);
		TypedQuery<Customer> rows = em.createQuery(
				"select c from Customer c" + where + " order by c.createdAt desc, c.id", Customer.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Customer> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
