package vn.tthome.identity.repos.refreshtoken;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.identity.models.entities.RefreshToken;

public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID>, RefreshTokenRepositoryCustom {

	Optional<RefreshToken> findByTokenHash(String tokenHash);

}
