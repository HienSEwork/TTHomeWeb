package vn.tthome.listing.repos.amenity;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.listing.models.entities.Amenity;

public interface AmenityRepository extends JpaRepository<Amenity, Short>, AmenityRepositoryCustom {

	boolean existsByCode(String code);

	boolean existsByCodeAndIdNot(String code, Short id);

}
