package vn.tthome.identity.repos;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.identity.models.entities.UserAccount;

public interface UserAccountRepository extends JpaRepository<UserAccount, UUID>, UserAccountRepositoryCustom {

	Optional<UserAccount> findByPhoneAndDeletedAtIsNull(String phone);

	Optional<UserAccount> findByEmailIgnoreCaseAndDeletedAtIsNull(String email);

}
