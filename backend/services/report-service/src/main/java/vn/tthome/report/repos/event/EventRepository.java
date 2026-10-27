package vn.tthome.report.repos.event;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.report.models.entities.Event;

public interface EventRepository extends JpaRepository<Event, UUID>, EventRepositoryCustom {
}
