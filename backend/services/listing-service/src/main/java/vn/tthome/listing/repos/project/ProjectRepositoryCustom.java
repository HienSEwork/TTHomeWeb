package vn.tthome.listing.repos.project;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.listing.models.entities.Project;

/** Hand-written queries for projects; methods are added when a task needs an optimized query. */
public interface ProjectRepositoryCustom {

	/**
	 * One page of non-deleted projects, newest first. Every filter is optional (null): text is a case-insensitive
	 * substring of the name or street address, status is exact, ward matches the old or the new ward, district exact.
	 */
	Page<Project> search(String text, String status, Integer wardId, Integer districtId, Pageable pageable);

	/** The live projects that have rooms, the ones with the most rooms first. */
	java.util.List<vn.tthome.listing.models.entities.Project> busiest(Pageable pageable);

	/** True when the project still has a non-deleted room. */
	boolean hasRooms(java.util.UUID id);

	/**
	 * Recomputes the room counters of a project from its non-deleted rooms: total and vacant rooms, the lowest price
	 * among the available rooms and the room types of the rooms that are not hidden.
	 */
	void refreshSummary(java.util.UUID id);

}
