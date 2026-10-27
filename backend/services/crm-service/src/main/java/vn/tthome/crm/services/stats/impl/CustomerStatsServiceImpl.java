package vn.tthome.crm.services.stats.impl;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.crm.models.dtos.CustomerStats;
import vn.tthome.crm.repos.consultrequest.ConsultRequestRepository;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.services.stats.CustomerStatsService;
import vn.tthome.common.error.ApiException;

@Service
public class CustomerStatsServiceImpl implements CustomerStatsService {

	private final CustomerRepository customers;
	private final ConsultRequestRepository requests;
	private final Clock clock;

	public CustomerStatsServiceImpl(CustomerRepository customers, ConsultRequestRepository requests, Clock clock) {
		this.customers = customers;
		this.requests = requests;
		this.clock = clock;
	}

	@Override
	@Transactional(readOnly = true)
	public CustomerStats customers(Instant from, Instant to) {
		Instant end = to != null ? to : clock.instant();
		Instant start = from != null ? from : end.minus(Duration.ofDays(30));
		if (!start.isBefore(end)) {
			throw new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "The period must end after it starts");
		}
		Map<String, Long> bySource = customers.countBy("source", start, end);
		Map<String, Long> byStage = customers.countBy("stage", start, end);
		Map<String, Long> consult = requests.countByStatus(start, end);
		return new CustomerStats(sum(bySource), bySource, byStage, sum(consult), consult);
	}

	private static long sum(Map<String, Long> counts) {
		return counts.values().stream().mapToLong(Long::longValue).sum();
	}

}
