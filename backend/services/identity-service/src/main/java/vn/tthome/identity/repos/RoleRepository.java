package vn.tthome.identity.repos;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.identity.models.entities.Role;

public interface RoleRepository extends JpaRepository<Role, Short>, RoleRepositoryCustom {

	Optional<Role> findByCode(String code);

}
