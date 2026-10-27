package vn.tthome.booking.repos.appointmenthistory;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.booking.models.entities.AppointmentHistory;

public interface AppointmentHistoryRepository
		extends JpaRepository<AppointmentHistory, UUID>, AppointmentHistoryRepositoryCustom {

	List<AppointmentHistory> findByAppointmentIdOrderByCreatedAtAsc(UUID appointmentId);

}
