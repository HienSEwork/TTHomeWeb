package vn.tthome.identity.repos.role;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.identity.models.entities.Role;

public interface RoleRepository extends JpaRepository<Role, Short>, RoleRepositoryCustom {

	Optional<Role> findByCode(String code);

	/** Every role with its permissions loaded in one query. */
	@EntityGraph(attributePaths = "permissions")
	List<Role> findAllByOrderByIdAsc();

}
