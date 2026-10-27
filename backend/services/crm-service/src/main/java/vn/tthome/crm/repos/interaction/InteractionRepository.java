package vn.tthome.crm.repos.interaction;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.crm.models.entities.Interaction;

public interface InteractionRepository extends JpaRepository<Interaction, UUID>, InteractionRepositoryCustom {

	org.springframework.data.domain.Page<Interaction> findByCustomerIdOrderByCreatedAtDescIdDesc(UUID customerId,
			org.springframework.data.domain.Pageable pageable);

}
