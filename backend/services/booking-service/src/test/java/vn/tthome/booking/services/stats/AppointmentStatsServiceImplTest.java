package vn.tthome.booking.services.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.booking.models.dtos.AppointmentStats;
import vn.tthome.booking.repos.appointment.AppointmentRepository;
import vn.tthome.booking.services.stats.impl.AppointmentStatsServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class AppointmentStatsServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-30T00:00:00Z");

	@Mock
	AppointmentRepository appointments;

	private AppointmentStatsServiceImpl service() {
		return new AppointmentStatsServiceImpl(appointments, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	@Test
	void theDefaultPeriodIsTheLastThirtyDaysAndTheUpcomingWindowIsSevenDays() {
		Instant start = Instant.parse("2026-05-31T00:00:00Z");
		when(appointments.countByStatusCreatedBetween(start, NOW)).thenReturn(Map.of("pending", 2L, "confirmed", 3L));
		when(appointments.countOpenBetween(NOW, Instant.parse("2026-07-07T00:00:00Z"))).thenReturn(4L);
		when(appointments.countWithStatus("pending")).thenReturn(2L);

		AppointmentStats stats = service().appointments(null, null);

		assertThat(stats.created()).isEqualTo(5);
		assertThat(stats.createdByStatus()).containsEntry("confirmed", 3L);
		assertThat(stats.upcomingOpen()).isEqualTo(4);
		assertThat(stats.pendingConfirmation()).isEqualTo(2);
	}

	@Test
	void anExplicitPeriodIsUsedAsGiven() {
		Instant from = Instant.parse("2026-01-01T00:00:00Z");
		Instant to = Instant.parse("2026-02-01T00:00:00Z");
		when(appointments.countByStatusCreatedBetween(from, to)).thenReturn(Map.of());

		assertThat(service().appointments(from, to).created()).isZero();

		verify(appointments).countByStatusCreatedBetween(from, to);
	}

	@Test
	void aPeriodThatEndsBeforeItStartsIsRefused() {
		Instant at = Instant.parse("2026-01-01T00:00:00Z");

		assertThatThrownBy(() -> service().appointments(at, at)).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(HttpStatus.BAD_REQUEST);
			assertThat(e.code()).isEqualTo("VALIDATION_ERROR");
		});
		assertThatThrownBy(() -> service().appointments(NOW, at)).isInstanceOf(ApiException.class);
	}

}
