package vn.tthome.identity.repos;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.identity.models.entities.OtpChallenge;
import vn.tthome.identity.models.enums.OtpPurpose;

public interface OtpChallengeRepository extends JpaRepository<OtpChallenge, UUID>, OtpChallengeRepositoryCustom {

	Optional<OtpChallenge> findFirstByTargetAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(String target,
			OtpPurpose purpose);

}
