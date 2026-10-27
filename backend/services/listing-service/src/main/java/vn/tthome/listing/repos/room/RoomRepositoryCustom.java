package vn.tthome.listing.repos.room;

import java.math.BigDecimal;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.listing.models.entities.Room;

/** Hand-written queries for rooms; methods are added when a task needs an optimized query. */
public interface RoomRepositoryCustom {

	/**
	 * One page of the non-deleted rooms of a project ordered by code. Every filter is optional (null): status exactly,
	 * text as a case-insensitive substring of the code or title.
	 */
	Page<Room> search(UUID projectId, String status, String text, Pageable pageable);

	/** The rooms that are not deleted counted by status, with the number of live projects. */
	vn.tthome.listing.models.dtos.InventoryStats inventory();

	/** Appends a row to the room status and price history (kept per month in partitions). */
	void recordHistory(UUID roomId, String status, BigDecimal price, String source);

}
