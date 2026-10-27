package vn.tthome.report.clients;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;
import vn.tthome.report.clients.impl.HttpStatsClient;
import vn.tthome.report.config.SourcesProperties;

/** The client against a stub server on localhost: mapping, forwarded token, errors and slow answers. */
class HttpStatsClientTest {

	private HttpServer server;
	private String base;
	private final AtomicReference<String> seenAuthorization = new AtomicReference<>();
	private final AtomicReference<String> seenQuery = new AtomicReference<>();

	@BeforeEach
	void start() throws IOException {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/api/v1/admin/stats/inventory", exchange -> {
			seenAuthorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
			reply(exchange, 200, "{\"projects\":3,\"rooms\":40,\"vacant\":12,\"reserved\":3,\"rented\":24,\"hidden\":1,\"extra\":true}");
		});
		server.createContext("/api/v1/admin/stats/appointments", exchange -> {
			seenQuery.set(exchange.getRequestURI().getRawQuery());
			reply(exchange, 200, "{\"created\":5,\"createdByStatus\":{\"pending\":3},\"upcomingOpen\":4,\"pendingConfirmation\":3}");
		});
		server.createContext("/api/v1/admin/stats/projects", exchange -> {
			seenQuery.set(exchange.getRequestURI().getRawQuery());
			reply(exchange, 200, "[{\"id\":\"" + java.util.UUID.randomUUID() + "\",\"name\":\"Green\",\"totalRooms\":20,\"vacantCount\":5,"
					+ "\"occupancy\":0.75,\"minPrice\":3000000}]");
		});
		server.createContext("/api/v1/admin/stats/customers", exchange -> reply(exchange, 500, "{\"code\":\"INTERNAL_ERROR\"}"));
		server.createContext("/api/v1/admin/stats/submissions", exchange -> {
			try {
				Thread.sleep(3_500);
			} catch (InterruptedException e) {
				Thread.currentThread().interrupt();
			}
			reply(exchange, 200, "{\"total\":1,\"byStatus\":{},\"pendingReview\":0}");
		});
		server.start();
		base = "http://127.0.0.1:" + server.getAddress().getPort();
	}

	@AfterEach
	void stop() {
		server.stop(0);
	}

	private static void reply(com.sun.net.httpserver.HttpExchange exchange, int status, String body) throws IOException {
		byte[] bytes = body.getBytes(StandardCharsets.UTF_8);
		exchange.getResponseHeaders().add("Content-Type", "application/json");
		try {
			exchange.sendResponseHeaders(status, bytes.length);
			exchange.getResponseBody().write(bytes);
		} catch (IOException ignored) {
			// The client gave up on a slow answer.
		} finally {
			exchange.close();
		}
	}

	private HttpStatsClient client(String url) {
		return new HttpStatsClient(new SourcesProperties(url, url, url, url));
	}

	@Test
	void anAnswerIsMappedIgnoringFieldsItDoesNotKnowAndTheTokenIsPassedOn() {
		var figures = client(base).inventory("Bearer abc");

		assertThat(figures).hasValueSatisfying(f -> {
			assertThat(f.vacant()).isEqualTo(12);
			assertThat(f.rooms()).isEqualTo(40);
			assertThat(f.hidden()).isEqualTo(1);
		});
		assertThat(seenAuthorization.get()).isEqualTo("Bearer abc");
	}

	@Test
	void thePeriodIsSentAsIsoInstants() {
		var figures = client(base).appointments("Bearer abc", Instant.parse("2026-07-01T00:00:00Z"), Instant.parse("2026-07-08T00:00:00Z"));

		assertThat(figures).hasValueSatisfying(f -> assertThat(f.createdByStatus()).containsEntry("pending", 3L));
		assertThat(seenQuery.get()).isEqualTo("from=2026-07-01T00:00:00Z&to=2026-07-08T00:00:00Z");
	}

	@Test
	void aListOfProjectsIsMapped() {
		var projects = client(base).projects("Bearer abc", 20);

		assertThat(projects).hasValueSatisfying(list -> {
			assertThat(list).hasSize(1);
			assertThat(list.get(0).name()).isEqualTo("Green");
			assertThat(list.get(0).occupancy()).isEqualTo(0.75);
			assertThat(list.get(0).minPrice()).isEqualTo(3_000_000L);
		});
		assertThat(seenQuery.get()).isEqualTo("size=20");
	}

	@Test
	void anErrorAnswerGivesNothing() {
		assertThat(client(base).customers("Bearer abc", Instant.now().minusSeconds(60), Instant.now())).isEmpty();
	}

	@Test
	void aServiceThatIsDownGivesNothing() {
		assertThat(client("http://127.0.0.1:1").inventory("Bearer abc")).isEmpty();
	}

	@Test
	void aSlowAnswerIsGivenUpOnAfterTheTimeout() {
		long started = System.nanoTime();

		var figures = client(base).submissions("Bearer abc");

		assertThat(figures).isEmpty();
		assertThat((System.nanoTime() - started) / 1_000_000).isLessThan(3_300);
	}

}
