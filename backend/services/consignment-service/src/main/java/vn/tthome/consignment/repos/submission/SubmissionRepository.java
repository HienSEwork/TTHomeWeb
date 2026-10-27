package vn.tthome.consignment.repos.submission;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.consignment.models.entities.Submission;

public interface SubmissionRepository extends JpaRepository<Submission, UUID>, SubmissionRepositoryCustom {
}
