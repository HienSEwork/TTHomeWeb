package vn.tthome.common.audit;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** Posts the event to report-service in the background, with a short timeout; a failure is logged and forgotten. */
public class HttpAuditSender implements AuditSender {

	private static final Logger log = LoggerFactory.getLogger(HttpAuditSender.class);
	private static final Duration TIMEOUT = Duration.ofSeconds(2);

	private final URI endpoint;
	private final RestClient http;
	private final ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor();

	public HttpAuditSender(String baseUrl) {
		this.endpoint = URI.create(baseUrl.replaceAll("/+$", "") + "/api/v1/admin/audit-logs");
		JdkClientHttpRequestFactory factory = new JdkClientHttpRequestFactory(HttpClient.newBuilder().connectTimeout(TIMEOUT).build());
		factory.setReadTimeout(TIMEOUT);
		this.http = RestClient.builder().requestFactory(factory).build();
	}

	@Override
	public void send(String authorization, AuditEvent event) {
		executor.execute(() -> {
			try {
				http.post().uri(endpoint).header(HttpHeaders.AUTHORIZATION, authorization).body(event).retrieve().toBodilessEntity();
			} catch (RuntimeException e) {
				log.warn("Could not write the audit entry {}: {}", event.action(), e.toString());
			}
		});
	}

	public void close() {
		executor.shutdown();
	}

}
