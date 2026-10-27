package vn.tthome.crm.services.carehistory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.crm.models.dtos.InteractionRequest;
import vn.tthome.crm.models.dtos.InteractionResponse;
import vn.tthome.crm.models.dtos.NoteRequest;
import vn.tthome.crm.models.dtos.NoteResponse;
import vn.tthome.crm.models.entities.Customer;
import vn.tthome.crm.models.entities.CustomerNote;
import vn.tthome.crm.models.entities.Interaction;
import vn.tthome.crm.repos.customer.CustomerRepository;
import vn.tthome.crm.repos.interaction.InteractionRepository;
import vn.tthome.crm.repos.note.CustomerNoteRepository;
import vn.tthome.crm.services.carehistory.impl.CareHistoryServiceImpl;

@ExtendWith(MockitoExtension.class)
class CareHistoryServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-01T10:00:00Z");
	private static final UUID ADMIN = UUID.randomUUID();

	@Mock
	CustomerRepository customers;
	@Mock
	InteractionRepository interactions;
	@Mock
	CustomerNoteRepository notes;

	private CareHistoryServiceImpl service() {
		return new CareHistoryServiceImpl(customers, interactions, notes, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private Customer customer() {
		Customer customer = new Customer();
		customer.setId(UUID.randomUUID());
		when(customers.findByIdAndDeletedAtIsNull(customer.getId())).thenReturn(Optional.of(customer));
		return customer;
	}

	private static void assertNotFound(Throwable thrown) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(HttpStatus.NOT_FOUND);
			assertThat(e.code()).isEqualTo("NOT_FOUND");
		});
	}

	@Test
	void aContactIsRecordedAndStampedAsTheLastContact() {
		Customer customer = customer();

		InteractionResponse response = service().addInteraction(ADMIN, customer.getId(),
				new InteractionRequest("call", "out", " Spoke about the budget "));

		ArgumentCaptor<Interaction> row = ArgumentCaptor.forClass(Interaction.class);
		verify(interactions).saveAndFlush(row.capture());
		assertThat(row.getValue().getCustomerId()).isEqualTo(customer.getId());
		assertThat(row.getValue().getActorId()).isEqualTo(ADMIN);
		assertThat(row.getValue().getKind()).isEqualTo("call");
		assertThat(row.getValue().getDirection()).isEqualTo("out");
		assertThat(response.summary()).isEqualTo("Spoke about the budget");
		assertThat(customer.getLastContactAt()).isEqualTo(NOW);
		verify(customers).saveAndFlush(customer);
	}

	@Test
	void theHistoryIsPagedNewestFirst() {
		Customer customer = customer();
		Interaction row = new Interaction();
		row.setId(UUID.randomUUID());
		row.setKind("call");
		when(interactions.findByCustomerIdOrderByCreatedAtDescIdDesc(customer.getId(), PageRequest.of(1, 5)))
				.thenReturn(new PageImpl<>(List.of(row), PageRequest.of(1, 5), 6));

		var page = service().interactions(customer.getId(), 1, 5);

		assertThat(page.items()).hasSize(1);
		assertThat(page.total()).isEqualTo(6);
	}

	@Test
	void aNoteIsStoredPublicUnlessMarkedPrivate() {
		Customer customer = customer();
		when(notes.saveAndFlush(any(CustomerNote.class))).thenAnswer(call -> call.getArgument(0));

		NoteResponse open = service().addNote(ADMIN, customer.getId(), new NoteRequest(" Likes quiet streets ", null));
		NoteResponse secret = service().addNote(ADMIN, customer.getId(), new NoteRequest("Budget is firm", true));

		assertThat(open.body()).isEqualTo("Likes quiet streets");
		assertThat(open.privateNote()).isFalse();
		assertThat(open.authorId()).isEqualTo(ADMIN);
		assertThat(secret.privateNote()).isTrue();
	}

	@Test
	void theNotesAreReadThroughTheReadersVisibility() {
		Customer customer = customer();
		CustomerNote note = new CustomerNote();
		note.setId(UUID.randomUUID());
		note.setAuthorId(ADMIN);
		note.setBody("x");
		when(notes.visibleTo(customer.getId(), ADMIN)).thenReturn(List.of(note));

		assertThat(service().notes(ADMIN, customer.getId())).hasSize(1);
	}

	@Test
	void unknownCustomersAreNotFound() {
		UUID unknown = UUID.randomUUID();
		when(customers.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().interactions(unknown, 0, 5)).satisfies(CareHistoryServiceImplTest::assertNotFound);
		assertThatThrownBy(() -> service().addInteraction(ADMIN, unknown, new InteractionRequest("call", null, "x")))
				.satisfies(CareHistoryServiceImplTest::assertNotFound);
		assertThatThrownBy(() -> service().notes(ADMIN, unknown)).satisfies(CareHistoryServiceImplTest::assertNotFound);
		assertThatThrownBy(() -> service().addNote(ADMIN, unknown, new NoteRequest("x", null)))
				.satisfies(CareHistoryServiceImplTest::assertNotFound);
		verify(interactions, never()).saveAndFlush(any());
		verify(notes, never()).saveAndFlush(any());
	}

}
