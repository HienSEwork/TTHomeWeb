package vn.tthome.identity.repos.permission;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.identity.models.entities.Permission;

public interface PermissionRepository extends JpaRepository<Permission, Short>, PermissionRepositoryCustom {
}
