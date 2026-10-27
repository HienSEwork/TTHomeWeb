package vn.tthome.booking.services.stats.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.booking.models.dtos.AppointmentStats;
import vn.tthome.booking.repos.appointment.AppointmentRepository;
import vn.tthome.booking.services.stats.AppointmentStatsService;
import vn.tthome.common.error.ApiException;

@Service
public class AppointmentStatsServiceImpl implements AppointmentStatsService {

	private final AppointmentRepository appointments;
	private final Clock clock;

	public AppointmentStatsServiceImpl(AppointmentRepository appointments, Clock clock) {
		this.appointments = appointments;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public AppointmentStats appointments(Instant from, Instant to) {
		Instant now = clock.instant();
		Instant end = to != null ? to : now;
		Instant start = from != null ? from : end.minus(Duration.ofDays(30));
		if (!start.isBefore(end)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "The period must end after it starts");
		}
		Map<String, Long> byStatus = appointments.countByStatusCreatedBetween(start, end);
		long created = byStatus.values().stream().mapToLong(Long::longValue).sum();
		return new AppointmentStats(created, byStatus, appointments.countOpenBetween(now, now.plus(Duration.ofDays(7))),
				appointments.countWithStatus("pending"));
	}

}
