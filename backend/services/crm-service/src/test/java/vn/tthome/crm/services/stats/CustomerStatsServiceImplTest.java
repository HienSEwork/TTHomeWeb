package vn.tthome.crm.services.stats;

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

import vn.tthome.common.error.ApiException;
import vn.tthome.crm.models.dtos.CustomerStats;
import vn.tthome.crm.repos.consultrequest.ConsultRequestRepository;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.services.stats.impl.CustomerStatsServiceImpl;

@ExtendWith(MockitoExtension.class)
class CustomerStatsServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-30T00:00:00Z");

	@Mock
	CustomerRepository customers;
	@Mock
	ConsultRequestRepository requests;

	private CustomerStatsServiceImpl service() {
		return new CustomerStatsServiceImpl(customers, requests, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	@Test
	void theDefaultPeriodIsTheLastThirtyDaysAndTotalsAreTheSumOfTheGroups() {
		Instant start = Instant.parse("2026-05-31T00:00:00Z");
		when(customers.countBy("source", start, NOW)).thenReturn(Map.of("web", 5L, "zalo", 2L));
		when(customers.countBy("stage", start, NOW)).thenReturn(Map.of("new", 6L, "viewing", 1L));
		when(requests.countByStatus(start, NOW)).thenReturn(Map.of("new", 2L, "done", 1L));

		CustomerStats stats = service().customers(null, null);

		assertThat(stats.newCustomers()).isEqualTo(7);
		assertThat(stats.bySource()).containsEntry("web", 5L);
		assertThat(stats.byStage()).containsEntry("viewing", 1L);
		assertThat(stats.newConsultRequests()).isEqualTo(3);
	}

	@Test
	void anExplicitPeriodIsUsedAndAnEmptyOneIsAllZeros() {
		Instant from = Instant.parse("2026-01-01T00:00:00Z");
		Instant to = Instant.parse("2026-02-01T00:00:00Z");
		when(customers.countBy("source", from, to)).thenReturn(Map.of());
		when(customers.countBy("stage", from, to)).thenReturn(Map.of());
		when(requests.countByStatus(from, to)).thenReturn(Map.of());

		CustomerStats stats = service().customers(from, to);

		assertThat(stats.newCustomers()).isZero();
		assertThat(stats.newConsultRequests()).isZero();
		verify(customers).countBy("source", from, to);
	}

	@Test
	void aPeriodThatEndsBeforeItStartsIsRefused() {
		Instant at = Instant.parse("2026-01-01T00:00:00Z");

		assertThatThrownBy(() -> service().customers(at, at)).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(HttpStatus.BAD_REQUEST);
			assertThat(e.code()).isEqualTo("VALIDATION_ERROR");
		});
	}

}
