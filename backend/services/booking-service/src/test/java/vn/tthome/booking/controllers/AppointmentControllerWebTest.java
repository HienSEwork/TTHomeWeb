package vn.tthome.booking.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.booking.models.dtos.AppointmentResponse;
import vn.tthome.booking.services.appointment.AppointmentService;
import vn.tthome.booking.support.TestTokens;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;

/** Routing, validation, authorization and error mapping of the appointment endpoints, with the service mocked. */
@WebMvcTest(AppointmentController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class AppointmentControllerWebTest {

	private static final String BASE = "/api/v1/admin/booking/appointments";
	private static final UUID ID = UUID.randomUUID();

	@Autowired
	MockMvc mvc;
	@MockitoBean
	AppointmentService appointments;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static AppointmentResponse sample() {
		return new AppointmentResponse(ID, "A-1", UUID.randomUUID(), null, UUID.randomUUID(), null, "in_person",
				Instant.parse("2026-07-01T09:00:00Z"), (short) 30, "pending", null, "An", "0912345678", null, null, null, null);
	}

	private static List<MockHttpServletRequestBuilder> everyEndpoint() {
		return List.of(get(BASE), get(BASE + "/" + ID), json(put(BASE + "/" + ID + "/staff"), "{}"),
				json(put(BASE + "/" + ID + "/status"), "{\"status\":\"confirmed\"}"),
				json(put(BASE + "/" + ID + "/reschedule"), "{\"scheduledAt\":\"2030-01-01T00:00:00Z\",\"durationMin\":30}"),
				json(put(BASE + "/" + ID + "/note"), "{\"note\":\"x\"}"));
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(appointments);
	}

	@Test
	void listParsesTheFiltersAndTheTimeRange() throws Exception {
		UUID staff = UUID.randomUUID();
		UUID project = UUID.randomUUID();
		Instant from = Instant.parse("2026-07-01T00:00:00Z");
		Instant to = Instant.parse("2026-07-02T00:00:00Z");
		when(appointments.list(null, null, null, null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(sample()), 0, 20, 1));
		when(appointments.list("pending", staff, project, from, to, "an", 1, 10)).thenReturn(new PageResponse<>(List.of(), 1, 10, 0));

		asAdmin(get(BASE)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].code").value("A-1"))
				.andExpect(jsonPath("$.items[0].history").doesNotExist());
		asAdmin(get(BASE + "?status=pending&staffId=" + staff + "&projectId=" + project + "&from=2026-07-01T00:00:00Z&to=2026-07-02T00:00:00Z&q=an&page=1&size=10"))
				.andExpect(status().isOk());
		for (String query : List.of("from=yesterday", "to=2026-13-45", "staffId=abc", "page=-1", "size=0", "size=101", "q=" + "x".repeat(101))) {
			asAdmin(get(BASE + "?" + query)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void assigningStaffAcceptsAnIdOrNull() throws Exception {
		UUID staff = UUID.randomUUID();
		when(appointments.assignStaff(any(UUID.class), eq(ID), eq(staff))).thenReturn(sample());
		when(appointments.assignStaff(any(UUID.class), eq(ID), eq(null))).thenReturn(sample());

		asAdmin(json(put(BASE + "/" + ID + "/staff"), "{\"staffId\":\"" + staff + "\"}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + ID + "/staff"), "{\"staffId\":null}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + ID + "/staff"), "{\"staffId\":\"nope\"}")).andExpect(status().isBadRequest());
	}

	@Test
	void statusChangesAcceptOnlyTheTargetsAnAdminMayChooseAndValidateTheText() throws Exception {
		when(appointments.setStatus(any(UUID.class), eq(ID), any())).thenReturn(sample());

		for (String status : List.of("confirmed", "completed", "cancelled", "no_show")) {
			asAdmin(json(put(BASE + "/" + ID + "/status"), "{\"status\":\"" + status + "\"}")).andExpect(status().isOk());
		}
		for (String body : List.of("{}", "{\"status\":\"pending\"}", "{\"status\":\"rescheduled\"}", "{\"status\":\"gone\"}",
				"{\"status\":\"cancelled\",\"reason\":\"" + "x".repeat(501) + "\"}", "{\"status\":\"confirmed\",\"note\":\"" + "x".repeat(2001) + "\"}")) {
			asAdmin(json(put(BASE + "/" + ID + "/status"), body)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void rescheduleAndNoteValidateTheirBodies() throws Exception {
		when(appointments.reschedule(any(UUID.class), eq(ID), any())).thenReturn(sample());
		when(appointments.setNote(eq(ID), any())).thenReturn(sample());

		asAdmin(json(put(BASE + "/" + ID + "/reschedule"), "{\"scheduledAt\":\"2030-01-01T00:00:00Z\",\"durationMin\":45}"))
				.andExpect(status().isOk());
		for (String body : List.of("{}", "{\"scheduledAt\":\"2030-01-01T00:00:00Z\"}", "{\"durationMin\":30}",
				"{\"scheduledAt\":\"soon\",\"durationMin\":30}", "{\"scheduledAt\":\"2030-01-01T00:00:00Z\",\"durationMin\":4}",
				"{\"scheduledAt\":\"2030-01-01T00:00:00Z\",\"durationMin\":481}")) {
			asAdmin(json(put(BASE + "/" + ID + "/reschedule"), body)).andExpect(status().isBadRequest());
		}
		asAdmin(json(put(BASE + "/" + ID + "/note"), "{\"note\":\"hello\"}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + ID + "/note"), "{\"note\":null}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/" + ID + "/note"), "{\"note\":\"" + "x".repeat(2001) + "\"}")).andExpect(status().isBadRequest());
	}

	@Test
	void serviceErrorsKeepTheirStatusAndTheCallerIsTheActor() throws Exception {
		when(appointments.get(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));
		when(appointments.setStatus(any(UUID.class), eq(ID), any()))
				.thenThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "closed"));

		asAdmin(get(BASE + "/" + ID)).andExpect(status().isNotFound());
		asAdmin(json(put(BASE + "/" + ID + "/status"), "{\"status\":\"confirmed\"}")).andExpect(status().isConflict())
				.andExpect(jsonPath("$.code").value("CONFLICT"));
		asAdmin(get(BASE + "/not-a-uuid")).andExpect(status().isBadRequest());
		verify(appointments).get(ID);
	}

}
