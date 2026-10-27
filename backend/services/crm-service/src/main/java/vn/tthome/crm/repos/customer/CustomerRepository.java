package vn.tthome.crm.repos.customer;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.crm.models.entities.Customer;

public interface CustomerRepository extends JpaRepository<Customer, UUID>, CustomerRepositoryCustom {

	java.util.Optional<Customer> findByIdAndDeletedAtIsNull(UUID id);

	boolean existsByPhoneAndDeletedAtIsNull(String phone);

	boolean existsByPhoneAndDeletedAtIsNullAndIdNot(String phone, UUID id);

}
