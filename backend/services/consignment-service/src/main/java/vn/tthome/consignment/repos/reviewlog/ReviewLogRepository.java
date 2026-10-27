package vn.tthome.consignment.repos.reviewlog;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.consignment.models.entities.ReviewLog;

public interface ReviewLogRepository extends JpaRepository<ReviewLog, UUID>, ReviewLogRepositoryCustom {

	List<ReviewLog> findBySubmissionIdOrderByCreatedAtAsc(UUID submissionId);

}
