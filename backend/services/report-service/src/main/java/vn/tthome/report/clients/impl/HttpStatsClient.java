package vn.tthome.report.clients.impl;

import java.net.http.HttpClient;
import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;

import vn.tthome.report.clients.StatsClient;
import vn.tthome.report.config.SourcesProperties;
import vn.tthome.report.models.dtos.AppointmentFigures;
import vn.tthome.report.models.dtos.CustomerFigures;
import vn.tthome.report.models.dtos.InventoryFigures;
import vn.tthome.report.models.dtos.SubmissionFigures;

@Component
public class HttpStatsClient implements StatsClient {

	private static final Logger log = LoggerFactory.getLogger(HttpStatsClient.class);
	private static final Duration TIMEOUT = Duration.ofSeconds(2);

	private final SourcesProperties sources;
	private final RestClient http;

	public HttpStatsClient(SourcesProperties sources) {
		this.sources = sources;
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(TIMEOUT).build());
		factory.setReadTimeout(TIMEOUT);
		this.http = RestClient.builder().requestFactory(factory).build();
	}

	@Override
	public Optional<InventoryFigures> inventory(String authorization) {
		return get(sources.listingUrl() + "/api/v1/admin/stats/inventory", authorization, InventoryFigures.class);
	}

	@Override
	public Optional<AppointmentFigures> appointments(String authorization, Instant from, Instant to) {
		return get(sources.bookingUrl() + "/api/v1/admin/stats/appointments?from=" + from + "&to=" + to, authorization,
				AppointmentFigures.class);
	}

	@Override
	public Optional<CustomerFigures> customers(String authorization, Instant from, Instant to) {
		return get(sources.crmUrl() + "/api/v1/admin/stats/customers?from=" + from + "&to=" + to, authorization,
				CustomerFigures.class);
	}

	@Override
	public Optional<SubmissionFigures> submissions(String authorization) {
		return get(sources.consignmentUrl() + "/api/v1/admin/stats/submissions", authorization, SubmissionFigures.class);
	}

	private <T> Optional<T> get(String url, String authorization, Class<T> type) {
		try {
			return Optional.ofNullable(http.get().uri(java.net.URI.create(url)).header(HttpHeaders.AUTHORIZATION, authorization)
					.retrieve().body(type));
		} catch (RuntimeException e) {
			log.warn("Could not read {}: {}", url.replaceAll("\\?.*", ""), e.toString());
			return Optional.empty();
		}
	}

}
