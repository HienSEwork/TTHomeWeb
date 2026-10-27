package vn.tthome.crm.repos.consultrequest;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.crm.models.entities.ConsultRequest;

public interface ConsultRequestRepository extends JpaRepository<ConsultRequest, UUID>, ConsultRequestRepositoryCustom {

}
