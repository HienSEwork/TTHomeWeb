package vn.tthome.report.services.overview.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import jakarta.annotation.PreDestroy;
import vn.tthome.report.clients.StatsClient;
import vn.tthome.report.models.dtos.AppointmentFigures;
import vn.tthome.report.models.dtos.CustomerFigures;
import vn.tthome.report.models.dtos.InventoryFigures;
import vn.tthome.report.models.dtos.ProjectFigures;
import vn.tthome.report.models.dtos.ReportOverview;
import vn.tthome.report.models.dtos.TrafficFigures;
import vn.tthome.report.repos.event.EventRepository;
import vn.tthome.report.services.overview.ReportService;
import vn.tthome.common.error.ApiException;

@Service
public class ReportServiceImpl implements ReportService {

	static final int PROJECTS = 20;
	private static final Duration LONGEST = Duration.ofDays(366);

	private final EventRepository events;
	private final StatsClient stats;
	private final Clock clock;
	private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

	public ReportServiceImpl(EventRepository events, StatsClient stats, Clock clock) {
		this.events = events;
		this.stats = stats;
		this.clock = clock;
	}

	@Override
	public ReportOverview overview(String authorization, Instant from, Instant to) {
		Instant end = to != null ? to : clock.instant();
		Instant start = from != null ? from : end.minus(Duration.ofDays(30));
		if (!start.isBefore(end)) {
			throw invalid("The period must end after it starts");
		}
		if (Duration.between(start, end).compareTo(LONGEST) > 0) {
			throw invalid("The period may not exceed 366 days");
		}
		CompletableFuture<Optional<AppointmentFigures>> appointments = CompletableFuture
				.supplyAsync(() -> stats.appointments(authorization, start, end), executor);
		CompletableFuture<Optional<CustomerFigures>> customers = CompletableFuture
				.supplyAsync(() -> stats.customers(authorization, start, end), executor);
		CompletableFuture<Optional<InventoryFigures>> inventory = CompletableFuture.supplyAsync(() -> stats.inventory(authorization), executor);
		CompletableFuture<Optional<List<ProjectFigures>>> projects = CompletableFuture
				.supplyAsync(() -> stats.projects(authorization, PROJECTS), executor);
		TrafficFigures traffic = traffic(start, end);

		Optional<AppointmentFigures> booked = appointments.join();
		Optional<CustomerFigures> people = customers.join();
		Optional<InventoryFigures> rooms = inventory.join();
		Optional<List<ProjectFigures>> top = projects.join();
		List<String> unavailable = new ArrayList<>();
		if (booked.isEmpty()) {
			unavailable.add("booking");
		}
		if (people.isEmpty()) {
			unavailable.add("crm");
		}
		if (rooms.isEmpty() || top.isEmpty()) {
			unavailable.add("listing");
		}
		Double rate = booked.isPresent() && traffic.visitors() > 0 ? (double) booked.get().created() / traffic.visitors() : null;
		return new ReportOverview(start, end, traffic, booked.orElse(null), rate, people.orElse(null), rooms.orElse(null),
				top.orElse(null), List.copyOf(unavailable));
	}

	private TrafficFigures traffic(Instant from, Instant to) {
		var byName = events.countByName(from, to);
		return new TrafficFigures(events.visitors(from, to), byName.getOrDefault("view", 0L), events.viewsByDay(from, to), byName);
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	@PreDestroy
	void stop() {
		executor.shutdown();
	}

}
