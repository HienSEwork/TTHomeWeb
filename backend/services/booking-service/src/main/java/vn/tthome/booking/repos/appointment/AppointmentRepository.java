package vn.tthome.booking.repos.appointment;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.booking.models.entities.Appointment;

public interface AppointmentRepository extends JpaRepository<Appointment, UUID>, AppointmentRepositoryCustom {
}
