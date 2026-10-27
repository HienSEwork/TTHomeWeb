package vn.tthome.cms.repos.partnerapplication;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.PartnerApplication;

public interface PartnerApplicationRepository extends JpaRepository<PartnerApplication, UUID>, PartnerApplicationRepositoryCustom {
}
