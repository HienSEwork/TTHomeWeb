package vn.tthome.crm.services.consultrequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
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

import vn.tthome.common.error.ApiException;
import vn.tthome.crm.models.dtos.ConsultRequestResponse;
import vn.tthome.crm.models.entities.ConsultRequest;
import vn.tthome.crm.repos.consultrequest.ConsultRequestRepository;
import vn.tthome.crm.services.consultrequest.impl.ConsultRequestServiceImpl;

@ExtendWith(MockitoExtension.class)
class ConsultRequestServiceImplTest {

	@Mock
	ConsultRequestRepository requests;

	private ConsultRequestServiceImpl service() {
		return new ConsultRequestServiceImpl(requests);
	}

	private ConsultRequest request(String status) {
		ConsultRequest request = new ConsultRequest();
		request.setId(UUID.randomUUID());
		request.setPhone("0912345678");
		request.setChannel("web");
		request.setStatus(status);
		request.setBudgetMax(new BigDecimal("4500000"));
		when(requests.findById(request.getId())).thenReturn(Optional.of(request));
		org.mockito.Mockito.lenient().when(requests.saveAndFlush(request)).thenReturn(request);
		return request;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void assigningANewRequestMarksItAssigned() {
		ConsultRequest request = request("new");
		UUID staff = UUID.randomUUID();

		ConsultRequestResponse response = service().assign(request.getId(), staff);

		assertThat(response.status()).isEqualTo("assigned");
		assertThat(response.assignedTo()).isEqualTo(staff);
		assertThat(response.budgetMax()).isEqualTo(4_500_000L);
	}

	@Test
	void reassigningKeepsTheStatusOfARequestBeingWorkedOn() {
		ConsultRequest request = request("contacted");
		UUID staff = UUID.randomUUID();

		assertThat(service().assign(request.getId(), staff).status()).isEqualTo("contacted");
	}

	@Test
	void removingTheAssigneeSendsAnAssignedRequestBackToNew() {
		ConsultRequest request = request("assigned");
		request.setAssignedTo(UUID.randomUUID());

		ConsultRequestResponse response = service().assign(request.getId(), null);

		assertThat(response.status()).isEqualTo("new");
		assertThat(response.assignedTo()).isNull();
	}

	@Test
	void finishedOrBusyRequestsRefuseTheWrongAssignment() {
		for (String closed : new String[] { "done", "spam" }) {
			ConsultRequest request = request(closed);
			assertThatThrownBy(() -> service().assign(request.getId(), UUID.randomUUID()))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		}
		ConsultRequest busy = request("contacted");
		assertThatThrownBy(() -> service().assign(busy.getId(), null)).satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
	}

	@Test
	void theAllowedStatusMovesWork() {
		assertThat(service().setStatus(request("assigned").getId(), "contacted").status()).isEqualTo("contacted");
		assertThat(service().setStatus(request("assigned").getId(), "done").status()).isEqualTo("done");
		assertThat(service().setStatus(request("contacted").getId(), "done").status()).isEqualTo("done");
		assertThat(service().setStatus(request("new").getId(), "spam").status()).isEqualTo("spam");
		assertThat(service().setStatus(request("contacted").getId(), "spam").status()).isEqualTo("spam");
	}

	@Test
	void theOtherMovesAreConflicts() {
		for (String[] move : new String[][] { { "new", "contacted" }, { "new", "done" }, { "contacted", "contacted" },
				{ "done", "contacted" }, { "done", "spam" }, { "spam", "done" } }) {
			ConsultRequest request = request(move[0]);
			assertThatThrownBy(() -> service().setStatus(request.getId(), move[1]))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
			assertThat(request.getStatus()).isEqualTo(move[0]);
		}
	}

	@Test
	void unknownRequestsAreNotFoundAndListIgnoresBlankFilters() {
		UUID unknown = UUID.randomUUID();
		when(requests.findById(unknown)).thenReturn(Optional.empty());
		when(requests.search(any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(new ConsultRequest()), PageRequest.of(1, 5), 6));

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().assign(unknown, null)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setStatus(unknown, "done")).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		assertThat(service().list(" ", null, "", 1, 5).total()).isEqualTo(6);
		verify(requests).search(eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
	}

}
