package vn.tthome.crm.repos.commission;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.crm.models.entities.Commission;

public interface CommissionRepository extends JpaRepository<Commission, UUID>, CommissionRepositoryCustom {

	/** A customer has at most one commission that is not cancelled (database constraint). */
	boolean existsByCustomerIdAndStatusNot(UUID customerId, String status);

}
