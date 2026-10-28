package vn.tthome.common.audit;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.BlockingQueue;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import com.sun.net.httpserver.HttpServer;

/** The sender against a stub server on localhost: what it posts, to where, and that failures stay silent. */
class HttpAuditSenderTest {

	private HttpServer server;
	private String base;
	private final BlockingQueue<String> received = new LinkedBlockingQueue<>();
	private volatile int answer = 201;

	@BeforeEach
	void start() throws IOException {
		server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
		server.createContext("/api/v1/admin/audit-logs", exchange -> {
			String body = new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8);
			received.add(exchange.getRequestMethod() + " " + exchange.getRequestHeaders().getFirst("Authorization") + " "
					+ exchange.getRequestHeaders().getFirst("Content-Type") + " " + body);
			exchange.sendResponseHeaders(answer, -1);
			exchange.close();
		});
		server.start();
		base = "http://127.0.0.1:" + server.getAddress().getPort();
	}

	@AfterEach
	void stop() {
		server.stop(0);
	}

	@Test
	void theEventIsPostedAsJsonWithTheAdminsToken() throws Exception {
		HttpAuditSender sender = new HttpAuditSender(base + "/");

		sender.send("Bearer abc", new AuditEvent("PUT /api/v1/admin/rooms/{id}", "rooms", "42", "203.0.113.9"));

		String sent = received.poll(5, TimeUnit.SECONDS);
		assertThat(sent).startsWith("POST Bearer abc application/json");
		assertThat(sent).contains("\"action\":\"PUT /api/v1/admin/rooms/{id}\"").contains("\"entityType\":\"rooms\"")
				.contains("\"entityId\":\"42\"").contains("\"ip\":\"203.0.113.9\"");
		sender.close();
	}

	@Test
	void anErrorAnswerOrADeadServerNeverThrowsToTheCaller() throws Exception {
		answer = 500;
		HttpAuditSender failing = new HttpAuditSender(base);
		failing.send("Bearer abc", new AuditEvent("POST /api/v1/admin/x", "x", null, "1.1.1.1"));
		assertThat(received.poll(5, TimeUnit.SECONDS)).isNotNull();

		HttpAuditSender dead = new HttpAuditSender("http://127.0.0.1:1");
		dead.send("Bearer abc", new AuditEvent("POST /api/v1/admin/x", "x", null, "1.1.1.1"));
		failing.close();
		dead.close();
	}

}
