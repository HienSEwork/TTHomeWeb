package vn.tthome.listing.repos.amenity.impl;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import vn.tthome.listing.repos.amenity.AmenityRepositoryCustom;

public class AmenityRepositoryImpl implements AmenityRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public short nextId() {
		return ((Number) em.createNativeQuery("select coalesce(max(id), 0) + 1 from inventory.amenity")
				.getSingleResult()).shortValue();
	}

	@Override
	@Transactional(readOnly = true)
	public boolean isUsed(short id) {
		return (boolean) em.createNativeQuery("select exists (select 1 from inventory.project_amenity where amenity_id = :id) or exists (select 1 from inventory.room_amenity where amenity_id = :id)")
				.setParameter("id", id).getSingleResult();
	}

}
