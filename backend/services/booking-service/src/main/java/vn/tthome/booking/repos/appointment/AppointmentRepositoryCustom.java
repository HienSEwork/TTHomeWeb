package vn.tthome.booking.repos.appointment;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.booking.models.entities.Appointment;

/** Hand-written queries for appointments; methods are added when a task needs an optimized query. */
public interface AppointmentRepositoryCustom {

	/**
	 * One page of appointments ordered by time (soonest first). Every filter is optional (null): status, staff and
	 * project exactly, the visit time within [from, to), text as a case-insensitive substring of the code, contact
	 * name or contact phone.
	 */
	Page<Appointment> search(String status, UUID staffId, UUID projectId, Instant from, Instant to, String text,
			Pageable pageable);

	/** The appointments created within [from, to) counted by status. */
	java.util.Map<String, Long> countByStatusCreatedBetween(Instant from, Instant to);

	/** The open appointments (pending, confirmed, rescheduled) whose visit falls within [from, to). */
	long countOpenBetween(Instant from, Instant to);

	/** The appointments with this status, whenever the visit is. */
	long countWithStatus(String status);

	/**
	 * True when the staff member has another appointment (other than the one given) that is still open (pending,
	 * confirmed or rescheduled) and whose visit overlaps [start, end).
	 */
	boolean staffBusy(UUID staffId, UUID exceptAppointmentId, Instant start, Instant end);

}
