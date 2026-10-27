package vn.tthome.listing.repos.room;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.listing.models.entities.Room;

public interface RoomRepository extends JpaRepository<Room, UUID>, RoomRepositoryCustom {

	Optional<Room> findByIdAndDeletedAtIsNull(UUID id);

	boolean existsBySlugAndDeletedAtIsNull(String slug);

	/** The code is unique per project among all rooms, deleted ones included (it is a database constraint). */
	boolean existsByProjectIdAndCode(UUID projectId, String code);

	boolean existsByProjectIdAndCodeAndIdNot(UUID projectId, String code, UUID id);

}
