package vn.tthome.crm.services.commission;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
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
import vn.tthome.crm.models.dtos.CollaboratorSummary;
import vn.tthome.crm.models.dtos.CommissionRequest;
import vn.tthome.crm.models.dtos.CommissionResponse;
import vn.tthome.crm.models.dtos.CommissionUpdateRequest;
import vn.tthome.crm.models.entities.Commission;
import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.repos.commission.CommissionRepository;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.services.commission.impl.CommissionServiceImpl;

@ExtendWith(MockitoExtension.class)
class CommissionServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-01T10:00:00Z");
	private static final UUID ADMIN = UUID.randomUUID();

	@Mock
	CommissionRepository commissions;
	@Mock
	CustomerRepository customers;

	private CommissionServiceImpl service() {
		return new CommissionServiceImpl(commissions, customers, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private Customer customer(String stage, UUID referrer) {
		Customer c = new Customer();
		c.setId(UUID.randomUUID());
		c.setStage(stage);
		c.setReferrerUserId(referrer);
		when(customers.findByIdAndDeletedAtIsNull(c.getId())).thenReturn(Optional.of(c));
		return c;
	}

	private Commission commission(String status) {
		Commission c = new Commission();
		c.setId(UUID.randomUUID());
		c.setCustomerId(UUID.randomUUID());
		c.setReferrerUserId(UUID.randomUUID());
		c.setAmount(new BigDecimal("500000"));
		c.setStatus(status);
		when(commissions.findById(c.getId())).thenReturn(Optional.of(c));
		org.mockito.Mockito.lenient().when(commissions.saveAndFlush(c)).thenReturn(c);
		return c;
	}

	private static Commission withAmount() {
		Commission c = new Commission();
		c.setAmount(new BigDecimal("1000"));
		return c;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void aRentedCustomerEarnsTheirReferrerAPendingCommission() {
		UUID referrer = UUID.randomUUID();
		Customer customer = customer("rented", referrer);
		when(commissions.saveAndFlush(any(Commission.class))).thenAnswer(call -> call.getArgument(0));

		CommissionResponse response = service().create(ADMIN, new CommissionRequest(customer.getId(), 750_000L, " First month "));

		assertThat(response.referrerUserId()).isEqualTo(referrer);
		assertThat(response.customerId()).isEqualTo(customer.getId());
		assertThat(response.amount()).isEqualTo(750_000L);
		assertThat(response.status()).isEqualTo("pending");
		assertThat(response.note()).isEqualTo("First month");
		assertThat(response.createdBy()).isEqualTo(ADMIN);
	}

	@Test
	void aCommissionNeedsAReferredCustomerWhoHasRentedAndNoOtherLiveCommission() {
		Customer notRented = customer("viewing", UUID.randomUUID());
		Customer noReferrer = customer("rented", null);
		Customer paidAlready = customer("rented", UUID.randomUUID());
		when(commissions.existsByCustomerIdAndStatusNot(paidAlready.getId(), "cancelled")).thenReturn(true);
		UUID unknown = UUID.randomUUID();
		when(customers.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());

		for (Customer bad : List.of(notRented, noReferrer)) {
			assertThatThrownBy(() -> service().create(ADMIN, new CommissionRequest(bad.getId(), 1L, null)))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		assertThatThrownBy(() -> service().create(ADMIN, new CommissionRequest(paidAlready.getId(), 1L, null)))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().create(ADMIN, new CommissionRequest(unknown, 1L, null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		verify(commissions, never()).saveAndFlush(any());
	}

	@Test
	void onlyAPendingCommissionCanBeEdited() {
		Commission pending = commission("pending");

		CommissionResponse response = service().update(pending.getId(), new CommissionUpdateRequest(900_000L, null));
		assertThat(response.amount()).isEqualTo(900_000L);

		for (String status : new String[] { "approved", "paid", "cancelled" }) {
			Commission other = commission(status);
			assertThatThrownBy(() -> service().update(other.getId(), new CommissionUpdateRequest(1L, null)))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
			assertThat(other.getAmount()).isEqualByComparingTo("500000");
		}
	}

	@Test
	void theAllowedStatusMovesWorkAndPayingStampsTheTime() {
		assertThat(service().setStatus(commission("pending").getId(), "approved").status()).isEqualTo("approved");
		assertThat(service().setStatus(commission("pending").getId(), "cancelled").status()).isEqualTo("cancelled");
		assertThat(service().setStatus(commission("approved").getId(), "cancelled").status()).isEqualTo("cancelled");

		CommissionResponse paid = service().setStatus(commission("approved").getId(), "paid");

		assertThat(paid.status()).isEqualTo("paid");
		assertThat(paid.paidAt()).isEqualTo(NOW);
	}

	@Test
	void theOtherMovesAreConflicts() {
		for (String[] move : new String[][] { { "pending", "paid" }, { "approved", "approved" }, { "paid", "cancelled" },
				{ "paid", "approved" }, { "cancelled", "approved" }, { "cancelled", "paid" } }) {
			Commission c = commission(move[0]);

			assertThatThrownBy(() -> service().setStatus(c.getId(), move[1])).satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
			assertThat(c.getStatus()).isEqualTo(move[0]);
			assertThat(c.getPaidAt()).isNull();
		}
	}

	@Test
	void unknownCommissionsAreNotFoundAndTheListsIgnoreBlankFilters() {
		UUID unknown = UUID.randomUUID();
		UUID referrer = UUID.randomUUID();
		when(commissions.findById(unknown)).thenReturn(Optional.empty());
		when(commissions.search(any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(withAmount()), PageRequest.of(1, 5), 6));
		when(commissions.collaborators(eq(referrer), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(new CollaboratorSummary(referrer, 3, 1, 500_000, 0)), PageRequest.of(0, 5), 1));

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().update(unknown, new CommissionUpdateRequest(1L, null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setStatus(unknown, "approved")).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		assertThat(service().list(null, null, " ", 1, 5).total()).isEqualTo(6);
		verify(commissions).search(eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(service().collaborators(referrer, 0, 5).items()).extracting(CollaboratorSummary::customers).containsExactly(3L);
	}

}
