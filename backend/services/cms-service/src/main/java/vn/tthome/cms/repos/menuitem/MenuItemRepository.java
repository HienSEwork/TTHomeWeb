package vn.tthome.cms.repos.menuitem;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.MenuItem;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID>, MenuItemRepositoryCustom {

	boolean existsByParentId(UUID parentId);

}
