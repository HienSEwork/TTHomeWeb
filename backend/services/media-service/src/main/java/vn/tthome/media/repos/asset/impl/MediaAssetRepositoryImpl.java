package vn.tthome.media.repos.asset.impl;

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
import vn.tthome.media.models.entities.MediaAsset;
import vn.tthome.media.repos.asset.MediaAssetRepositoryCustom;

public class MediaAssetRepositoryImpl implements MediaAssetRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public Page<MediaAsset> search(String folder, String resourceType, String text, Pageable pageable) {
		StringBuilder where = new StringBuilder(" where a.deletedAt is null");
		Map<String, Object> params = new HashMap<>();
		if (folder != null) {
			where.append(" and (a.folder = :folder or a.folder like :folderPrefix escape '!')");
			params.put("folder", folder);
			params.put("folderPrefix", escapeLike(folder) + "/%");
		}
		if (resourceType != null) {
			where.append(" and a.resourceType = :resourceType");
			params.put("resourceType", resourceType);
		}
		if (text != null) {
			where.append(" and (lower(a.publicId) like :text escape '!' or lower(a.altText) like :text escape '!')");
			params.put("text", "%" + escapeLike(text.toLowerCase(Locale.ROOT)) + "%");
		}
		TypedQuery<Long> count = em.createQuery("select count(a) from MediaAsset a" + where, Long.class);
		TypedQuery<MediaAsset> rows = em.createQuery(
				"select a from MediaAsset a" + where + " order by a.createdAt desc, a.id", MediaAsset.class);
		params.forEach((name, value) -> {
			count.setParameter(name, value);
			rows.setParameter(name, value);
		});
		List<MediaAsset> page = rows.setFirstResult((int) pageable.getOffset()).setMaxResults(pageable.getPageSize())
				.getResultList();
		return new PageImpl<>(page, pageable, count.getSingleResult());
	}

	private static String escapeLike(String value) {
		return value.replace("!", "!!").replace("%", "!%").replace("_", "!_");
	}

}
