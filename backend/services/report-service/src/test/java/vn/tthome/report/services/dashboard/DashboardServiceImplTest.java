package vn.tthome.report.services.dashboard;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import vn.tthome.report.clients.StatsClient;
import vn.tthome.report.models.dtos.AppointmentFigures;
import vn.tthome.report.models.dtos.CustomerFigures;
import vn.tthome.report.models.dtos.DashboardResponse;
import vn.tthome.report.models.dtos.InventoryFigures;
import vn.tthome.report.models.dtos.SubmissionFigures;
import vn.tthome.report.services.dashboard.impl.DashboardServiceImpl;

@ExtendWith(MockitoExtension.class)
class DashboardServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-30T00:00:00Z");
	private static final String TOKEN = "Bearer abc";

	@Mock
	StatsClient stats;

	private DashboardServiceImpl service() {
		return new DashboardServiceImpl(stats, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private void everythingAnswers() {
		when(stats.inventory(TOKEN)).thenReturn(Optional.of(new InventoryFigures(3, 40, 12, 3, 24, 1)));
		when(stats.appointments(any(), any(), any())).thenReturn(Optional.of(new AppointmentFigures(9, Map.of(), 4, 2)));
		when(stats.customers(any(), any(), any())).thenReturn(Optional.of(new CustomerFigures(7, Map.of(), Map.of(), 3, Map.of())));
		when(stats.submissions(TOKEN)).thenReturn(Optional.of(new SubmissionFigures(6, Map.of(), 4)));
	}

	@Test
	void theFiguresOfEveryServiceAreCollected() {
		everythingAnswers();

		DashboardResponse response = service().dashboard(TOKEN, 7);

		assertThat(response.vacantRooms()).isEqualTo(12);
		assertThat(response.totalRooms()).isEqualTo(40);
		assertThat(response.upcomingAppointments()).isEqualTo(4);
		assertThat(response.appointmentsToConfirm()).isEqualTo(2);
		assertThat(response.newCustomers()).isEqualTo(7);
		assertThat(response.newConsultRequests()).isEqualTo(3);
		assertThat(response.pendingConsignments()).isEqualTo(4);
		assertThat(response.unavailable()).isEmpty();
	}

	@Test
	void thePeriodIsTheLastGivenDaysAndIsPassedToTheServicesThatNeedIt() {
		everythingAnswers();

		DashboardResponse response = service().dashboard(TOKEN, 14);

		assertThat(response.to()).isEqualTo(NOW);
		assertThat(response.from()).isEqualTo(Instant.parse("2026-06-16T00:00:00Z"));
		verify(stats).appointments(TOKEN, response.from(), NOW);
		verify(stats).customers(TOKEN, response.from(), NOW);
	}

	@Test
	void aServiceThatDoesNotAnswerLeavesItsFiguresNullAndIsNamed() {
		when(stats.inventory(TOKEN)).thenReturn(Optional.empty());
		when(stats.appointments(any(), any(), any())).thenReturn(Optional.of(new AppointmentFigures(9, Map.of(), 4, 2)));
		when(stats.customers(any(), any(), any())).thenReturn(Optional.empty());
		when(stats.submissions(TOKEN)).thenReturn(Optional.of(new SubmissionFigures(6, Map.of(), 0)));

		DashboardResponse response = service().dashboard(TOKEN, 7);

		assertThat(response.vacantRooms()).isNull();
		assertThat(response.totalRooms()).isNull();
		assertThat(response.newCustomers()).isNull();
		assertThat(response.newConsultRequests()).isNull();
		assertThat(response.upcomingAppointments()).isEqualTo(4);
		assertThat(response.pendingConsignments()).isZero();
		assertThat(response.unavailable()).containsExactly("listing", "crm");
	}

	@Test
	void whenNothingAnswersEveryServiceIsNamedAndEveryFigureIsNull() {
		when(stats.inventory(TOKEN)).thenReturn(Optional.empty());
		when(stats.appointments(any(), any(), any())).thenReturn(Optional.empty());
		when(stats.customers(any(), any(), any())).thenReturn(Optional.empty());
		when(stats.submissions(TOKEN)).thenReturn(Optional.empty());

		DashboardResponse response = service().dashboard(TOKEN, 7);

		assertThat(response.unavailable()).containsExactly("listing", "booking", "crm", "consignment");
		assertThat(response.vacantRooms()).isNull();
		assertThat(response.upcomingAppointments()).isNull();
		assertThat(response.pendingConsignments()).isNull();
	}

}
