package vn.tthome.booking.services.appointment;

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

import vn.tthome.booking.models.dtos.AppointmentNoteRequest;
import vn.tthome.booking.models.dtos.AppointmentRescheduleRequest;
import vn.tthome.booking.models.dtos.AppointmentResponse;
import vn.tthome.booking.models.dtos.AppointmentStatusRequest;
import vn.tthome.booking.models.entities.Appointment;
import vn.tthome.booking.models.entities.AppointmentHistory;
import vn.tthome.booking.repos.appointment.AppointmentRepository;
import vn.tthome.booking.repos.appointmenthistory.AppointmentHistoryRepository;
import vn.tthome.booking.services.appointment.impl.AppointmentServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class AppointmentServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-10T10:00:00Z");
	private static final UUID ADMIN = UUID.randomUUID();

	@Mock
	AppointmentRepository appointments;
	@Mock
	AppointmentHistoryRepository history;

	private AppointmentServiceImpl service() {
		return new AppointmentServiceImpl(appointments, history, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private Appointment appointment(String status, Instant at) {
		Appointment a = new Appointment();
		a.setId(UUID.randomUUID());
		a.setCode("A-1");
		a.setStatus(status);
		a.setScheduledAt(at);
		a.setDurationMin((short) 30);
		when(appointments.findById(a.getId())).thenReturn(Optional.of(a));
		return a;
	}

	private static AppointmentStatusRequest status(String status, String reason) {
		return new AppointmentStatusRequest(status, reason, null);
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	private AppointmentHistory lastHistory() {
		ArgumentCaptor<AppointmentHistory> row = ArgumentCaptor.forClass(AppointmentHistory.class);
		verify(history).saveAndFlush(row.capture());
		return row.getValue();
	}

	@Test
	void confirmingAPendingAppointmentIsRecorded() {
		Appointment a = appointment("pending", NOW.plusSeconds(3600));

		AppointmentResponse response = service().setStatus(ADMIN, a.getId(), new AppointmentStatusRequest("confirmed", null, " Call first "));

		assertThat(response.status()).isEqualTo("confirmed");
		assertThat(response.note()).isEqualTo("Call first");
		AppointmentHistory row = lastHistory();
		assertThat(row.getFromStatus()).isEqualTo("pending");
		assertThat(row.getToStatus()).isEqualTo("confirmed");
		assertThat(row.getChangedBy()).isEqualTo(ADMIN);
		assertThat(row.getAppointmentId()).isEqualTo(a.getId());
	}

	@Test
	void everyMoveThatIsNotAllowedIsAConflict() {
		for (String[] move : new String[][] { { "pending", "completed" }, { "pending", "no_show" }, { "confirmed", "confirmed" },
				{ "completed", "confirmed" }, { "completed", "cancelled" }, { "cancelled", "confirmed" }, { "no_show", "completed" } }) {
			Appointment a = appointment(move[0], NOW.minusSeconds(3600));

			assertThatThrownBy(() -> service().setStatus(ADMIN, a.getId(), status(move[1], "reason")))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
			assertThat(a.getStatus()).isEqualTo(move[0]);
		}
		verify(appointments, never()).saveAndFlush(any());
		verify(history, never()).saveAndFlush(any());
	}

	@Test
	void cancellingNeedsAReasonAndKeepsIt() {
		Appointment a = appointment("confirmed", NOW.plusSeconds(3600));

		for (String reason : new String[] { null, "", "  " }) {
			assertThatThrownBy(() -> service().setStatus(ADMIN, a.getId(), status("cancelled", reason)))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		AppointmentResponse response = service().setStatus(ADMIN, a.getId(), status("cancelled", " Customer asked "));

		assertThat(response.status()).isEqualTo("cancelled");
		assertThat(response.cancelReason()).isEqualTo("Customer asked");
		assertThat(lastHistory().getNote()).isEqualTo("Customer asked");
	}

	@Test
	void completedAndNoShowNeedTheVisitTimeToHavePassed() {
		Appointment future = appointment("confirmed", NOW.plusSeconds(60));
		Appointment past = appointment("confirmed", NOW.minusSeconds(60));
		Appointment other = appointment("rescheduled", NOW.minusSeconds(60));

		for (String target : new String[] { "completed", "no_show" }) {
			assertThatThrownBy(() -> service().setStatus(ADMIN, future.getId(), status(target, null)))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		assertThat(service().setStatus(ADMIN, past.getId(), status("completed", null)).status()).isEqualTo("completed");
		assertThat(service().setStatus(ADMIN, other.getId(), status("no_show", null)).status()).isEqualTo("no_show");
	}

	@Test
	void aRescheduledAppointmentCanBeConfirmedAgain() {
		Appointment a = appointment("rescheduled", NOW.plusSeconds(3600));

		assertThat(service().setStatus(ADMIN, a.getId(), status("confirmed", null)).status()).isEqualTo("confirmed");
	}

	@Test
	void assigningStaffChecksTheirCalendarAndRecordsIt() {
		Appointment a = appointment("confirmed", NOW.plusSeconds(3600));
		UUID staff = UUID.randomUUID();
		UUID busy = UUID.randomUUID();
		when(appointments.staffBusy(staff, a.getId(), a.getScheduledAt(), a.getScheduledAt().plusSeconds(30 * 60))).thenReturn(false);
		when(appointments.staffBusy(busy, a.getId(), a.getScheduledAt(), a.getScheduledAt().plusSeconds(30 * 60))).thenReturn(true);

		assertThatThrownBy(() -> service().assignStaff(ADMIN, a.getId(), busy))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThat(a.getStaffId()).isNull();

		assertThat(service().assignStaff(ADMIN, a.getId(), staff).staffId()).isEqualTo(staff);
		AppointmentHistory row = lastHistory();
		assertThat(row.getFromStatus()).isEqualTo("confirmed");
		assertThat(row.getToStatus()).isEqualTo("confirmed");
		assertThat(row.getNote()).isEqualTo("Staff assigned");
	}

	@Test
	void removingTheStaffNeedsNoCalendarCheck() {
		Appointment a = appointment("pending", NOW.plusSeconds(3600));
		a.setStaffId(UUID.randomUUID());

		assertThat(service().assignStaff(ADMIN, a.getId(), null).staffId()).isNull();

		verify(appointments, never()).staffBusy(any(), any(), any(), any());
		assertThat(lastHistory().getNote()).isEqualTo("Staff removed");
	}

	@Test
	void closedAppointmentsCannotBeAssignedOrRescheduled() {
		for (String closed : new String[] { "completed", "cancelled", "no_show" }) {
			Appointment a = appointment(closed, NOW.minusSeconds(3600));

			assertThatThrownBy(() -> service().assignStaff(ADMIN, a.getId(), UUID.randomUUID()))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
			assertThatThrownBy(() -> service().reschedule(ADMIN, a.getId(),
					new AppointmentRescheduleRequest(NOW.plusSeconds(86400), (short) 30, null)))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		}
		verify(appointments, never()).saveAndFlush(any());
	}

	@Test
	void rescheduleMovesTheVisitAndMarksItRescheduled() {
		Appointment a = appointment("confirmed", NOW.plusSeconds(3600));
		Instant later = NOW.plusSeconds(86400);

		AppointmentResponse response = service().reschedule(ADMIN, a.getId(), new AppointmentRescheduleRequest(later, (short) 45, " Moved "));

		assertThat(response.status()).isEqualTo("rescheduled");
		assertThat(response.scheduledAt()).isEqualTo(later);
		assertThat(response.durationMin()).isEqualTo((short) 45);
		AppointmentHistory row = lastHistory();
		assertThat(row.getFromStatus()).isEqualTo("confirmed");
		assertThat(row.getToStatus()).isEqualTo("rescheduled");
		assertThat(row.getNote()).isEqualTo("Moved");
	}

	@Test
	void rescheduleRefusesThePastAndABusyStaffMember() {
		Appointment a = appointment("pending", NOW.plusSeconds(3600));
		a.setStaffId(UUID.randomUUID());
		Instant later = NOW.plusSeconds(86400);
		when(appointments.staffBusy(a.getStaffId(), a.getId(), later, later.plusSeconds(30 * 60))).thenReturn(true);

		assertThatThrownBy(() -> service().reschedule(ADMIN, a.getId(), new AppointmentRescheduleRequest(NOW, (short) 30, null)))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().reschedule(ADMIN, a.getId(), new AppointmentRescheduleRequest(later, (short) 30, null)))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThat(a.getStatus()).isEqualTo("pending");
	}

	@Test
	void theNoteIsReplacedOrCleared() {
		Appointment a = appointment("pending", NOW.plusSeconds(3600));

		assertThat(service().setNote(a.getId(), new AppointmentNoteRequest(" Bring ID ")).note()).isEqualTo("Bring ID");
		assertThat(service().setNote(a.getId(), new AppointmentNoteRequest("  ")).note()).isNull();
		assertThat(service().setNote(a.getId(), new AppointmentNoteRequest(null)).note()).isNull();
	}

	@Test
	void getReturnsTheHistoryAndUnknownAppointmentsAreNotFound() {
		Appointment a = appointment("pending", NOW.plusSeconds(3600));
		AppointmentHistory row = new AppointmentHistory();
		row.setFromStatus("pending");
		row.setToStatus("confirmed");
		when(history.findByAppointmentIdOrderByCreatedAtAsc(a.getId())).thenReturn(List.of(row));
		UUID unknown = UUID.randomUUID();
		when(appointments.findById(unknown)).thenReturn(Optional.empty());

		assertThat(service().get(a.getId()).history()).hasSize(1);
		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setStatus(ADMIN, unknown, status("confirmed", null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().assignStaff(ADMIN, unknown, null))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setNote(unknown, new AppointmentNoteRequest("x")))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void listIgnoresBlankFilters() {
		Appointment a = new Appointment();
		a.setId(UUID.randomUUID());
		a.setDurationMin((short) 30);
		when(appointments.search(any(), any(), any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(a), PageRequest.of(1, 5), 6));

		var page = service().list(" ", null, null, null, null, "", 1, 5);

		verify(appointments).search(eq(null), eq(null), eq(null), eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(page.total()).isEqualTo(6);
		assertThat(page.items().get(0).history()).isNull();
	}

}
