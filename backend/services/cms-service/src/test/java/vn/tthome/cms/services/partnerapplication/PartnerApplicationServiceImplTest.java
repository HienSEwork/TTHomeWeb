package vn.tthome.cms.services.partnerapplication;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import vn.tthome.cms.models.entities.PartnerApplication;
import vn.tthome.cms.repos.partnerapplication.PartnerApplicationRepository;
import vn.tthome.cms.services.partnerapplication.impl.PartnerApplicationServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class PartnerApplicationServiceImplTest {

	@Mock
	PartnerApplicationRepository applications;

	private PartnerApplicationServiceImpl service() {
		return new PartnerApplicationServiceImpl(applications);
	}

	private PartnerApplication application(String status) {
		PartnerApplication a = new PartnerApplication();
		a.setId(UUID.randomUUID());
		a.setKind("ctv");
		a.setFullName("An");
		a.setPhone("0912345678");
		a.setStatus(status);
		when(applications.findById(a.getId())).thenReturn(Optional.of(a));
		return a;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void theAllowedMovesWork() {
		assertThat(service().setStatus(application("new").getId(), "contacted").status()).isEqualTo("contacted");
		assertThat(service().setStatus(application("new").getId(), "approved").status()).isEqualTo("approved");
		assertThat(service().setStatus(application("new").getId(), "rejected").status()).isEqualTo("rejected");
		assertThat(service().setStatus(application("contacted").getId(), "approved").status()).isEqualTo("approved");
		assertThat(service().setStatus(application("contacted").getId(), "rejected").status()).isEqualTo("rejected");
	}

	@Test
	void everyOtherMoveIsAConflictAndChangesNothing() {
		for (String[] move : new String[][] { { "contacted", "contacted" }, { "approved", "rejected" }, { "approved", "contacted" },
				{ "rejected", "approved" }, { "rejected", "contacted" } }) {
			PartnerApplication a = application(move[0]);

			assertThatThrownBy(() -> service().setStatus(a.getId(), move[1])).satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
			assertThat(a.getStatus()).isEqualTo(move[0]);
		}
		verify(applications, never()).saveAndFlush(any());
	}

	@Test
	void unknownApplicationsAreNotFoundAndListIgnoresBlankFilters() {
		UUID unknown = UUID.randomUUID();
		when(applications.findById(unknown)).thenReturn(Optional.empty());
		when(applications.search(any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(new PartnerApplication()), PageRequest.of(1, 5), 6));

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setStatus(unknown, "approved")).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		assertThat(service().list(" ", "", null, 1, 5).total()).isEqualTo(6);
		verify(applications).search(eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
	}

}
