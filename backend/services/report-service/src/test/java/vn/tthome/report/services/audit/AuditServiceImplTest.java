package vn.tthome.report.services.audit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.report.models.dtos.AuditEntry;
import vn.tthome.report.models.dtos.AuditRecordRequest;
import vn.tthome.report.repos.auditlog.AuditLogRepository;
import vn.tthome.report.services.audit.impl.AuditServiceImpl;

@ExtendWith(MockitoExtension.class)
class AuditServiceImplTest {

	private static final UUID ACTOR = UUID.randomUUID();

	@Mock
	AuditLogRepository log;

	private AuditServiceImpl service() {
		return new AuditServiceImpl(log);
	}

	@Test
	void aLineIsWrittenForTheActorWithTidyValues() {
		service().record(ACTOR, new AuditRecordRequest(" PUT /api/v1/admin/rooms/{id} ", "rooms", "  ", "203.0.113.9"));

		verify(log).record(ACTOR, "203.0.113.9", "PUT /api/v1/admin/rooms/{id}", "rooms", null);
	}

	@Test
	void anIpv6AddressIsKeptInItsCanonicalForm() {
		service().record(ACTOR, new AuditRecordRequest("POST /api/v1/admin/x", null, null, "2001:db8::1"));

		verify(log).record(ACTOR, "2001:db8:0:0:0:0:0:1", "POST /api/v1/admin/x", null, null);
	}

	@Test
	void anAddressThatIsNotAnIpLiteralBecomesUnknownInsteadOfLosingTheLine() {
		for (String bad : new String[] { null, "", " ", "999.1.1.1", "a.b", "::::", "1:2", "deadbeef" }) {
			service().record(ACTOR, new AuditRecordRequest("DELETE /api/v1/admin/x/{id}", "x", "1", bad));
		}

		verify(log, org.mockito.Mockito.times(8)).record(eq(ACTOR), eq(null), eq("DELETE /api/v1/admin/x/{id}"), eq("x"), eq("1"));
	}

	@Test
	void listIgnoresBlankFiltersAndPassesThePage() {
		AuditEntry entry = new AuditEntry(UUID.randomUUID(), ACTOR, "1.1.1.1", "POST /a", "a", null, Instant.now());
		when(log.search(any(), any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(entry), PageRequest.of(1, 5), 6));

		var page = service().list(null, " ", "", null, null, 1, 5);

		verify(log).search(eq(null), eq(null), eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(page.items()).containsExactly(entry);
		assertThat(page.total()).isEqualTo(6);
	}

	@Test
	void aPeriodThatEndsBeforeItStartsIsRefused() {
		Instant at = Instant.parse("2026-01-01T00:00:00Z");

		assertThatThrownBy(() -> service().list(null, null, null, at, at, 0, 5)).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(HttpStatus.BAD_REQUEST);
			assertThat(e.code()).isEqualTo("VALIDATION_ERROR");
		});
	}

}
