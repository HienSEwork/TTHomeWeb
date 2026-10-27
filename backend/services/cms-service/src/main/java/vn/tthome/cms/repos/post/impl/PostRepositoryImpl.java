package vn.tthome.cms.repos.post.impl;

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
import vn.tthome.cms.models.entities.Post;
import vn.tthome.cms.repos.post.PostRepositoryCustom;

public class PostRepositoryImpl implements PostRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<Post> search(String locale, String status, UUID categoryId, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where p.deletedAt is null");
		Map<String, Object> params = new HashMap<>();
		if (locale != null) {
			where.append(" and p.locale = :locale");
			params.put("locale", locale);
		}
		if (status != null) {
			where.append(" and p.status = :status");
			params.put("status", status);
		}
		if (categoryId != null) {
			where.append(" and p.categoryId = :categoryId");
			params.put("categoryId", categoryId);
		}
		if (text != null) {
			where.append(" and lower(p.title) like :text escape '!'");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(p) from Post p" + where, Long.class);
		TypedQuery<Post> rows = em.createQuery(
				"select p from Post p" + where + " order by p.publishedAt desc nulls last, p.id desc", Post.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<Post> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
