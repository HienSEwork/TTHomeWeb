package vn.tthome.listing.repos.landmark;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.listing.models.entities.Landmark;

public interface LandmarkRepository extends JpaRepository<Landmark, Short>, LandmarkRepositoryCustom {

	boolean existsByCode(String code);

	boolean existsByCodeAndIdNot(String code, Short id);

}
