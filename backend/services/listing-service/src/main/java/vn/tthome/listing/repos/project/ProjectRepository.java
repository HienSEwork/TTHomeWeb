package vn.tthome.listing.repos.project;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.listing.models.entities.Project;

public interface ProjectRepository extends JpaRepository<Project, UUID>, ProjectRepositoryCustom {

	Optional<Project> findByIdAndDeletedAtIsNull(UUID id);

	boolean existsBySlugAndDeletedAtIsNull(String slug);

}
