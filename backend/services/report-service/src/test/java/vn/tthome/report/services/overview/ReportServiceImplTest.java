package vn.tthome.report.services.overview;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.report.clients.StatsClient;
import vn.tthome.report.models.dtos.AppointmentFigures;
import vn.tthome.report.models.dtos.CustomerFigures;
import vn.tthome.report.models.dtos.DayCount;
import vn.tthome.report.models.dtos.InventoryFigures;
import vn.tthome.report.models.dtos.ProjectFigures;
import vn.tthome.report.models.dtos.ReportOverview;
import vn.tthome.report.repos.event.EventRepository;
import vn.tthome.report.services.overview.impl.ReportServiceImpl;

@ExtendWith(MockitoExtension.class)
class ReportServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-30T00:00:00Z");
	private static final String TOKEN = "Bearer abc";

	@Mock
	EventRepository events;
	@Mock
	StatsClient stats;

	private ReportServiceImpl service() {
		return new ReportServiceImpl(events, stats, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private void traffic(Instant from, Instant to, long visitors, long views) {
		when(events.countByName(from, to)).thenReturn(Map.of("view", views, "click_call", 3L));
		when(events.visitors(from, to)).thenReturn(visitors);
		when(events.viewsByDay(from, to)).thenReturn(List.of(new DayCount(LocalDate.parse("2026-06-29"), views)));
	}

	private void servicesAnswer(Instant from, Instant to) {
		when(stats.appointments(TOKEN, from, to)).thenReturn(Optional.of(new AppointmentFigures(10, Map.of("pending", 6L, "confirmed", 4L), 4, 6)));
		when(stats.customers(TOKEN, from, to))
				.thenReturn(Optional.of(new CustomerFigures(8, Map.of("web", 5L, "zalo", 3L), Map.of("new", 8L), 2, Map.of())));
		when(stats.inventory(TOKEN)).thenReturn(Optional.of(new InventoryFigures(3, 40, 12, 3, 24, 1)));
		when(stats.projects(TOKEN, 20)).thenReturn(Optional.of(List.of(new ProjectFigures(UUID.randomUUID(), "Green", 20, 5, 0.75, 3_000_000L))));
	}

	@Test
	void theBookingRateIsTheAppointmentsOverTheVisitors() {
		Instant from = Instant.parse("2026-06-01T00:00:00Z");
		traffic(from, NOW, 200, 900);
		servicesAnswer(from, NOW);

		ReportOverview report = service().overview(TOKEN, from, NOW);

		assertThat(report.traffic().visitors()).isEqualTo(200);
		assertThat(report.traffic().views()).isEqualTo(900);
		assertThat(report.traffic().eventsByName()).containsEntry("click_call", 3L);
		assertThat(report.bookingRate()).isEqualTo(0.05);
		assertThat(report.customers().bySource()).containsEntry("web", 5L);
		assertThat(report.projects()).hasSize(1);
		assertThat(report.unavailable()).isEmpty();
	}

	@Test
	void theDefaultPeriodIsTheLastThirtyDays() {
		Instant from = Instant.parse("2026-05-31T00:00:00Z");
		traffic(from, NOW, 10, 20);
		servicesAnswer(from, NOW);

		ReportOverview report = service().overview(TOKEN, null, null);

		assertThat(report.from()).isEqualTo(from);
		assertThat(report.to()).isEqualTo(NOW);
		verify(events).visitors(from, NOW);
	}

	@Test
	void withoutVisitorsThereIsNoRateRatherThanADivisionByZero() {
		Instant from = Instant.parse("2026-06-01T00:00:00Z");
		traffic(from, NOW, 0, 0);
		servicesAnswer(from, NOW);

		assertThat(service().overview(TOKEN, from, NOW).bookingRate()).isNull();
	}

	@Test
	void aServiceThatDoesNotAnswerLeavesItsPartNullAndIsNamed() {
		Instant from = Instant.parse("2026-06-01T00:00:00Z");
		traffic(from, NOW, 100, 400);
		when(stats.appointments(TOKEN, from, NOW)).thenReturn(Optional.empty());
		when(stats.customers(TOKEN, from, NOW)).thenReturn(Optional.of(new CustomerFigures(1, Map.of(), Map.of(), 0, Map.of())));
		when(stats.inventory(TOKEN)).thenReturn(Optional.empty());
		when(stats.projects(TOKEN, 20)).thenReturn(Optional.empty());

		ReportOverview report = service().overview(TOKEN, from, NOW);

		assertThat(report.appointments()).isNull();
		assertThat(report.bookingRate()).isNull();
		assertThat(report.inventory()).isNull();
		assertThat(report.projects()).isNull();
		assertThat(report.customers()).isNotNull();
		assertThat(report.traffic().visitors()).isEqualTo(100);
		assertThat(report.unavailable()).containsExactly("booking", "listing");
	}

	@Test
	void theProjectsAloneMissingStillCountsListingAsUnavailable() {
		Instant from = Instant.parse("2026-06-01T00:00:00Z");
		traffic(from, NOW, 100, 400);
		servicesAnswer(from, NOW);
		when(stats.projects(TOKEN, 20)).thenReturn(Optional.empty());

		ReportOverview report = service().overview(TOKEN, from, NOW);

		assertThat(report.unavailable()).containsExactly("listing");
		assertThat(report.inventory()).isNotNull();
	}

	@Test
	void anInvalidPeriodIsRefusedBeforeAnythingIsAsked() {
		Instant from = Instant.parse("2026-06-01T00:00:00Z");

		for (Instant[] period : new Instant[][] { { NOW, NOW }, { NOW, from }, { NOW.minusSeconds(86_400L * 400), NOW } }) {
			assertThatThrownBy(() -> service().overview(TOKEN, period[0], period[1])).isInstanceOfSatisfying(ApiException.class, e -> {
				assertThat(e.status()).isEqualTo(HttpStatus.BAD_REQUEST);
				assertThat(e.code()).isEqualTo("VALIDATION_ERROR");
			});
		}
		org.mockito.Mockito.verifyNoInteractions(events, stats);
	}

	@Test
	void aPeriodOfExactlyThreeHundredSixtySixDaysIsAllowed() {
		Instant from = NOW.minusSeconds(86_400L * 366);
		traffic(from, NOW, 1, 1);
		servicesAnswer(from, NOW);

		assertThat(service().overview(TOKEN, from, NOW).from()).isEqualTo(from);
	}

}
