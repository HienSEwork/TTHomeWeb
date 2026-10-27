package vn.tthome.report.services.dashboard.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import vn.tthome.report.clients.StatsClient;
import vn.tthome.report.models.dtos.AppointmentFigures;
import vn.tthome.report.models.dtos.CustomerFigures;
import vn.tthome.report.models.dtos.DashboardResponse;
import vn.tthome.report.models.dtos.InventoryFigures;
import vn.tthome.report.models.dtos.SubmissionFigures;
import vn.tthome.report.services.dashboard.DashboardService;

@Service
public class DashboardServiceImpl implements DashboardService {

	private final StatsClient stats;
	private final Clock clock;
	private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

	public DashboardServiceImpl(StatsClient stats, Clock clock) {
		this.stats = stats;
		this.clock = clock;
	}

	@Override
	public DashboardResponse dashboard(String authorization, int days) {
		Instant to = clock.instant();
		Instant from = to.minus(Duration.ofDays(days));
		CompletableFuture<Optional<InventoryFigures>> inventory = CompletableFuture.supplyAsync(() -> stats.inventory(authorization), executor);
		CompletableFuture<Optional<AppointmentFigures>> appointments = CompletableFuture
				.supplyAsync(() -> stats.appointments(authorization, from, to), executor);
		CompletableFuture<Optional<CustomerFigures>> customers = CompletableFuture
				.supplyAsync(() -> stats.customers(authorization, from, to), executor);
		CompletableFuture<Optional<SubmissionFigures>> submissions = CompletableFuture.supplyAsync(() -> stats.submissions(authorization), executor);

		Optional<InventoryFigures> rooms = inventory.join();
		Optional<AppointmentFigures> visits = appointments.join();
		Optional<CustomerFigures> people = customers.join();
		Optional<SubmissionFigures> listings = submissions.join();
		List<String> unavailable = new ArrayList<>();
		if (rooms.isEmpty()) {
			unavailable.add("listing");
		}
		if (visits.isEmpty()) {
			unavailable.add("booking");
		}
		if (people.isEmpty()) {
			unavailable.add("crm");
		}
		if (listings.isEmpty()) {
			unavailable.add("consignment");
		}
		return new DashboardResponse(from, to, rooms.map(InventoryFigures::vacant).orElse(null),
				rooms.map(InventoryFigures::rooms).orElse(null), visits.map(AppointmentFigures::upcomingOpen).orElse(null),
				visits.map(AppointmentFigures::pendingConfirmation).orElse(null), people.map(CustomerFigures::newCustomers).orElse(null),
				people.map(CustomerFigures::newConsultRequests).orElse(null), listings.map(SubmissionFigures::pendingReview).orElse(null),
				List.copyOf(unavailable));
	}

	@PreDestroy
	void stop() {
		executor.shutdown();
	}

}
