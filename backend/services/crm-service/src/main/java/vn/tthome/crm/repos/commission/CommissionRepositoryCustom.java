package vn.tthome.crm.repos.commission;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.crm.models.dtos.CollaboratorSummary;
import vn.tthome.crm.models.entities.Commission;

/** Hand-written queries for commissions and collaborators; methods are added when a task needs an optimized query. */
public interface CommissionRepositoryCustom {

	/**
	 * One page of commissions, newest first. Every filter is optional (null): referrer, customer and status exactly.
	 */
	Page<Commission> search(UUID referrerUserId, UUID customerId, String status, Pageable pageable);

	/**
	 * One page of the collaborators that have referred at least one live customer, the busiest first, with what they
	 * brought in and what they are owed. The optional referrer narrows it to one collaborator.
	 */
	Page<CollaboratorSummary> collaborators(UUID referrerUserId, Pageable pageable);

}
