package vn.tthome.cms.repos.faq;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.cms.models.entities.Faq;

public interface FaqRepository extends JpaRepository<Faq, UUID>, FaqRepositoryCustom {

}
