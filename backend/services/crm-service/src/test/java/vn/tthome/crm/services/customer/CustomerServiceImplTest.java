package vn.tthome.crm.services.customer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.crm.models.dtos.CustomerRequest;
import vn.tthome.crm.models.dtos.CustomerResponse;
import vn.tthome.crm.models.dtos.CustomerStageRequest;
import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.models.entities.Interaction;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.repos.interaction.InteractionRepository;
import vn.tthome.crm.services.customer.impl.CustomerServiceImpl;

@ExtendWith(MockitoExtension.class)
class CustomerServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-01T10:00:00Z");
	private static final UUID ADMIN = UUID.randomUUID();

	@Mock
	CustomerRepository customers;
	@Mock
	InteractionRepository interactions;

	private CustomerServiceImpl service() {
		return new CustomerServiceImpl(customers, interactions, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private static CustomerRequest request(String phone) {
		return new CustomerRequest(" An Nguyen ", phone, " An@Example.COM ", " an.zalo ", "hotline", null, (short) 2, null);
	}

	private Customer existing(String stage) {
		Customer customer = new Customer();
		customer.setId(UUID.randomUUID());
		customer.setFullName("Old");
		customer.setStage(stage);
		when(customers.findByIdAndDeletedAtIsNull(customer.getId())).thenReturn(Optional.of(customer));
		return customer;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	private Interaction lastInteraction() {
		ArgumentCaptor<Interaction> row = ArgumentCaptor.forClass(Interaction.class);
		verify(interactions).saveAndFlush(row.capture());
		return row.getValue();
	}

	@Test
	void createStartsInTheNewStageWithTidyValues() {
		when(customers.saveAndFlush(any(Customer.class))).thenAnswer(call -> call.getArgument(0));

		CustomerResponse response = service().create(request("0912345678"));

		assertThat(response.id()).isNotNull();
		assertThat(response.fullName()).isEqualTo("An Nguyen");
		assertThat(response.email()).isEqualTo("an@example.com");
		assertThat(response.zalo()).isEqualTo("an.zalo");
		assertThat(response.stage()).isEqualTo("new");
		assertThat(response.source()).isEqualTo("hotline");
		assertThat(response.priority()).isEqualTo((short) 2);
	}

	@Test
	void aPhoneNumberBelongsToOneLiveCustomer() {
		Customer customer = existing("new");
		when(customers.existsByPhoneAndDeletedAtIsNull("0912345678")).thenReturn(true);
		when(customers.existsByPhoneAndDeletedAtIsNullAndIdNot("0912345678", customer.getId())).thenReturn(true);

		assertThatThrownBy(() -> service().create(request("0912345678"))).satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().update(customer.getId(), request("0912345678")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		verify(customers, never()).saveAndFlush(any());
	}

	@Test
	void aCustomerWithoutAPhoneNeedsNoUniquenessCheck() {
		when(customers.saveAndFlush(any(Customer.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(request(null)).phone()).isNull();

		verify(customers, never()).existsByPhoneAndDeletedAtIsNull(any());
	}

	@Test
	void updateReplacesTheDetailsButNotTheStage() {
		Customer customer = existing("viewing");
		when(customers.saveAndFlush(customer)).thenReturn(customer);

		CustomerResponse response = service().update(customer.getId(), request("0987654321"));

		assertThat(response.fullName()).isEqualTo("An Nguyen");
		assertThat(response.phone()).isEqualTo("0987654321");
		assertThat(response.stage()).isEqualTo("viewing");
	}

	@Test
	void aStageChangeIsWrittenIntoTheCareHistory() {
		Customer customer = existing("new");

		CustomerResponse response = service().setStage(ADMIN, customer.getId(), new CustomerStageRequest("contacted", null));

		assertThat(response.stage()).isEqualTo("contacted");
		Interaction row = lastInteraction();
		assertThat(row.getKind()).isEqualTo("stage_change");
		assertThat(row.getSummary()).isEqualTo("new -> contacted");
		assertThat(row.getActorId()).isEqualTo(ADMIN);
		assertThat(row.getCustomerId()).isEqualTo(customer.getId());
	}

	@Test
	void lostNeedsAReasonAndAnyOtherStageDropsIt() {
		Customer customer = existing("viewing");

		for (String reason : new String[] { null, "", " " }) {
			assertThatThrownBy(() -> service().setStage(ADMIN, customer.getId(), new CustomerStageRequest("lost", reason)))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		CustomerResponse lost = service().setStage(ADMIN, customer.getId(), new CustomerStageRequest("lost", " Too dear "));
		assertThat(lost.lostReason()).isEqualTo("Too dear");

		CustomerResponse back = service().setStage(ADMIN, customer.getId(), new CustomerStageRequest("viewing", "ignored"));
		assertThat(back.lostReason()).isNull();
	}

	@Test
	void movingToTheSameStageIsAConflict() {
		Customer customer = existing("rented");

		assertThatThrownBy(() -> service().setStage(ADMIN, customer.getId(), new CustomerStageRequest("rented", null)))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		verify(interactions, never()).saveAndFlush(any());
	}

	@Test
	void assigningTheOwnerIsWrittenIntoTheCareHistory() {
		Customer customer = existing("new");
		UUID owner = UUID.randomUUID();

		assertThat(service().assignOwner(ADMIN, customer.getId(), owner).ownerUserId()).isEqualTo(owner);
		assertThat(lastInteraction().getSummary()).contains("Owner assigned").contains(owner.toString());
	}

	@Test
	void removingTheOwnerIsWrittenToo() {
		Customer customer = existing("new");
		customer.setOwnerUserId(UUID.randomUUID());

		assertThat(service().assignOwner(ADMIN, customer.getId(), null).ownerUserId()).isNull();
		assertThat(lastInteraction().getSummary()).isEqualTo("Owner removed");
	}

	@Test
	void deleteStampsTheTimeAndUnknownCustomersAreNotFound() {
		Customer customer = existing("new");
		UUID unknown = UUID.randomUUID();
		when(customers.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());

		service().delete(customer.getId());

		assertThat(customer.getDeletedAt()).isEqualTo(NOW);
		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().update(unknown, request(null))).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setStage(ADMIN, unknown, new CustomerStageRequest("lost", "x")))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().assignOwner(ADMIN, unknown, null)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void listIgnoresBlankFilters() {
		when(customers.search(any(), any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(new Customer()), PageRequest.of(1, 5), 6));

		var page = service().list(" ", null, null, "", "  ", 1, 5);

		verify(customers).search(eq(null), eq(null), eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(page.total()).isEqualTo(6);
	}

}
