package vn.tthome.listing.services.project;

import java.util.UUID;

import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.ProjectRequest;
import vn.tthome.listing.models.dtos.ProjectResponse;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;

/** Administration of projects (buildings and complexes). */
public interface ProjectService {

	/** One page of projects ordered by name; blank filters are ignored. */
	PageResponse<ProjectResponse> list(String text, String status, Integer wardId, Integer districtId, int page,
			int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted project. */
	ProjectResponse get(UUID id);

	/**
	 * Creates an active project with a generated code and a slug derived from the name.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for an unknown ward or district, or one of
	 *         the wrong level or scheme.
	 */
	ProjectResponse create(ProjectRequest request);

	/**
	 * Replaces the editable fields. The slug follows the name only while the name changes.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR as for create.
	 */
	ProjectResponse update(UUID id, ProjectRequest request);

	/**
	 * Shows (active), hides (hidden) or closes (closed) the project.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted project.
	 */
	ProjectResponse setStatus(UUID id, String status);

	/**
	 * Replaces the amenities of the project.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR for an unknown amenity or one
	 *         that applies to rooms only.
	 */
	ProjectResponse setAmenities(UUID id, SetAmenitiesRequest request);

	/**
	 * Deletes the project (kept in the database, no longer visible).
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT while the project has rooms.
	 */
	void delete(UUID id);

}
