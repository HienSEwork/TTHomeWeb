package vn.tthome.listing.services.room;

import java.util.UUID;

import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.RoomAvailabilityRequest;
import vn.tthome.listing.models.dtos.RoomRequest;
import vn.tthome.listing.models.dtos.RoomResponse;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;

/** Administration of rooms. Every change keeps the room counters and minimum price of the project up to date. */
public interface RoomService {

	/**
	 * One page of the rooms of a project ordered by code; blank filters are ignored.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted project.
	 */
	PageResponse<RoomResponse> list(UUID projectId, String status, String text, int page, int size);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted room. */
	RoomResponse get(UUID id);

	/**
	 * Creates an available room with a slug derived from the project name and room code, and records its first price.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown project, 409 CONFLICT when the project
	 *         already has a room with this code.
	 */
	RoomResponse create(UUID projectId, RoomRequest request);

	/**
	 * Replaces the editable fields; a changed price is recorded in the history.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 409 CONFLICT for a code of another room.
	 */
	RoomResponse update(UUID id, RoomRequest request);

	/**
	 * Changes the status, the price, or both and records the result in the history.
	 *
	 * @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR when neither is given, 404 NOT_FOUND.
	 */
	RoomResponse setAvailability(UUID id, RoomAvailabilityRequest request);

	/**
	 * Replaces the amenities of the room.
	 *
	 * @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR for an unknown amenity or one
	 *         that applies to projects only.
	 */
	RoomResponse setAmenities(UUID id, SetAmenitiesRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown or deleted room. */
	void delete(UUID id);

}
