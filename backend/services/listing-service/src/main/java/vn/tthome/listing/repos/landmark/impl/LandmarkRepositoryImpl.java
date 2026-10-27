package vn.tthome.listing.repos.landmark.impl;

import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import vn.tthome.listing.repos.landmark.LandmarkRepositoryCustom;

public class LandmarkRepositoryImpl implements LandmarkRepositoryCustom {

	@PersistenceContext
	private EntityManager em;

	@Override
	@Transactional(readOnly = true)
	public short nextId() {
		return ((Number) em.createNativeQuery("select coalesce(max(id), 0) + 1 from inventory.landmark")
				.getSingleResult()).shortValue();
	}

}
