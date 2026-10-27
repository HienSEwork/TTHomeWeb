package vn.tthome.crm.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.crm.CrmIntegrationTestBase;
import vn.tthome.crm.support.TestTokens;

/** The customer and consultation endpoints against a real PostgreSQL: mapping, filters, history and constraints. */
@AutoConfigureMockMvc
class AdminCrmTests extends CrmIntegrationTestBase {

	private static final String CUSTOMERS = "/api/v1/admin/crm/customers";
	private static final String REQUESTS = "/api/v1/admin/crm/consult-requests";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private final UUID admin = UUID.randomUUID();

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.bearerFor(admin, "ADMIN")));
	}

	private ResultActions asOther(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.bearerFor(UUID.randomUUID(), "ADMIN")));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String marker() {
		return "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	private static String phone() {
		return "09" + String.format("%08d", Math.floorMod(UUID.randomUUID().getMostSignificantBits(), 100_000_000));
	}

	private static String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	private static String customer(String name, String phone, String source) {
		return "{\"fullName\":\" " + name + " \",\"phone\":" + (phone == null ? "null" : "\"" + phone + "\"")
				+ ",\"email\":\"" + name.replace(" ", "").toLowerCase() + "@Example.com\",\"zalo\":\"z\",\"source\":\"" + source
				+ "\",\"priority\":3,\"nextFollowupAt\":\"2027-01-01T08:00:00Z\"}";
	}

	// --- customers -----------------------------------------------------------------------------------------------

	@Test
	void aCustomerRoundTripsEveryFieldAndStartsNew() throws Exception {
		String name = "Khach " + marker();
		String phone = phone();

		String id = idOf(asAdmin(json(post(CUSTOMERS), customer(name, phone, "zalo"))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.stage").value("new")));

		asAdmin(get(CUSTOMERS + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value(name))
				.andExpect(jsonPath("$.phone").value(phone)).andExpect(jsonPath("$.email").value(name.replace(" ", "").toLowerCase() + "@example.com"))
				.andExpect(jsonPath("$.zalo").value("z")).andExpect(jsonPath("$.source").value("zalo")).andExpect(jsonPath("$.priority").value(3))
				.andExpect(jsonPath("$.nextFollowupAt").value("2027-01-01T08:00:00Z")).andExpect(jsonPath("$.createdAt").isNotEmpty())
				.andExpect(jsonPath("$.ownerUserId").doesNotExist());
		asAdmin(get(CUSTOMERS + "/" + UUID.randomUUID())).andExpect(status().isNotFound());
	}

	@Test
	void aPhoneNumberBelongsToOneLiveCustomerAndIsFreedByADelete() throws Exception {
		String phone = phone();
		String first = idOf(asAdmin(json(post(CUSTOMERS), customer("One " + marker(), phone, "web"))).andExpect(status().isCreated()));

		asAdmin(json(post(CUSTOMERS), customer("Two " + marker(), phone, "web"))).andExpect(status().isConflict());
		String second = idOf(asAdmin(json(post(CUSTOMERS), customer("Two " + marker(), phone(), "web"))));
		asAdmin(json(put(CUSTOMERS + "/" + second), customer("Two " + marker(), phone, "web"))).andExpect(status().isConflict());
		asAdmin(json(put(CUSTOMERS + "/" + first), customer("One renamed " + marker(), phone, "hotline"))).andExpect(status().isOk())
				.andExpect(jsonPath("$.source").value("hotline"));

		asAdmin(delete(CUSTOMERS + "/" + first)).andExpect(status().isNoContent());
		asAdmin(get(CUSTOMERS + "/" + first)).andExpect(status().isNotFound());
		asAdmin(json(post(CUSTOMERS), customer("Three " + marker(), phone, "web"))).andExpect(status().isCreated());
		asAdmin(delete(CUSTOMERS + "/" + first)).andExpect(status().isNotFound());
	}

	@Test
	void listFiltersByStageOwnerSourceAndTextNewestFirst() throws Exception {
		String m = marker();
		UUID owner = UUID.randomUUID();
		String oldest = idOf(asAdmin(json(post(CUSTOMERS), customer("Alpha " + m, phone(), "web"))));
		String newest = idOf(asAdmin(json(post(CUSTOMERS), customer("Beta " + m, phone(), "facebook"))));
		asAdmin(json(put(CUSTOMERS + "/" + newest + "/owner"), "{\"userId\":\"" + owner + "\"}")).andExpect(status().isOk());
		asAdmin(json(put(CUSTOMERS + "/" + newest + "/stage"), "{\"stage\":\"viewing\"}")).andExpect(status().isOk());

		asAdmin(get(CUSTOMERS + "?q=" + m.toUpperCase())).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].id").value(newest)).andExpect(jsonPath("$.items[1].id").value(oldest));
		asAdmin(get(CUSTOMERS + "?q=" + m + "&stage=viewing")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(CUSTOMERS + "?q=" + m + "&ownerUserId=" + owner)).andExpect(jsonPath("$.items[0].id").value(newest));
		asAdmin(get(CUSTOMERS + "?q=" + m + "&source=web")).andExpect(jsonPath("$.items[0].id").value(oldest));
		asAdmin(get(CUSTOMERS + "?q=" + m + "&size=1&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].id").value(oldest)).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(CUSTOMERS + "?q=" + m.substring(0, 5) + "_" + m.substring(6))).andExpect(jsonPath("$.total").value(0));
	}

	@Test
	void stageAndOwnerChangesLandInTheCareHistory() throws Exception {
		String id = idOf(asAdmin(json(post(CUSTOMERS), customer("Care " + marker(), phone(), "web"))));
		UUID owner = UUID.randomUUID();

		asAdmin(json(put(CUSTOMERS + "/" + id + "/stage"), "{\"stage\":\"new\"}")).andExpect(status().isConflict());
		asAdmin(json(put(CUSTOMERS + "/" + id + "/stage"), "{\"stage\":\"lost\"}")).andExpect(status().isBadRequest());
		asAdmin(json(put(CUSTOMERS + "/" + id + "/stage"), "{\"stage\":\"lost\",\"lostReason\":\"Found elsewhere\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.stage").value("lost")).andExpect(jsonPath("$.lostReason").value("Found elsewhere"));
		asAdmin(json(put(CUSTOMERS + "/" + id + "/stage"), "{\"stage\":\"contacted\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.lostReason").doesNotExist());
		asAdmin(json(put(CUSTOMERS + "/" + id + "/owner"), "{\"userId\":\"" + owner + "\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.ownerUserId").value(owner.toString()));
		asAdmin(json(put(CUSTOMERS + "/" + id + "/owner"), "{\"userId\":null}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.ownerUserId").doesNotExist());

		asAdmin(get(CUSTOMERS + "/" + id + "/interactions")).andExpect(jsonPath("$.total").value(4))
				.andExpect(jsonPath("$.items[0].summary").value("Owner removed")).andExpect(jsonPath("$.items[0].kind").value("system"))
				.andExpect(jsonPath("$.items[1].summary").value(org.hamcrest.Matchers.startsWith("Owner assigned")))
				.andExpect(jsonPath("$.items[2].summary").value("lost -> contacted")).andExpect(jsonPath("$.items[2].kind").value("stage_change"))
				.andExpect(jsonPath("$.items[3].summary").value("new -> lost: Found elsewhere"));
	}

	@Test
	void contactsAreRecordedStampTheLastContactAndPage() throws Exception {
		String id = idOf(asAdmin(json(post(CUSTOMERS), customer("Contact " + marker(), phone(), "web"))));

		asAdmin(json(post(CUSTOMERS + "/" + id + "/interactions"), "{\"kind\":\"call\",\"direction\":\"out\",\"summary\":\" Asked about budget \"}"))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.summary").value("Asked about budget"))
				.andExpect(jsonPath("$.actorId").value(admin.toString()));
		asAdmin(json(post(CUSTOMERS + "/" + id + "/interactions"), "{\"kind\":\"zalo\",\"summary\":\"Sent photos\"}")).andExpect(status().isCreated());

		asAdmin(get(CUSTOMERS + "/" + id)).andExpect(jsonPath("$.lastContactAt").isNotEmpty());
		asAdmin(get(CUSTOMERS + "/" + id + "/interactions?size=1")).andExpect(jsonPath("$.items.length()").value(1)).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].kind").value("zalo"));
		asAdmin(json(post(CUSTOMERS + "/" + UUID.randomUUID() + "/interactions"), "{\"kind\":\"call\",\"summary\":\"x\"}")).andExpect(status().isNotFound());
		assertThat(jdbc.sql("select count(*) from crm.interaction where customer_id = cast(:id as uuid)").param("id", id).query(Integer.class)
				.single()).isEqualTo(2);
	}

	@Test
	void privateNotesAreSeenByTheirAuthorOnly() throws Exception {
		String id = idOf(asAdmin(json(post(CUSTOMERS), customer("Notes " + marker(), phone(), "web"))));

		asAdmin(json(post(CUSTOMERS + "/" + id + "/notes"), "{\"body\":\" Prefers mornings \"}")).andExpect(status().isCreated())
				.andExpect(jsonPath("$.body").value("Prefers mornings")).andExpect(jsonPath("$.privateNote").value(false));
		asAdmin(json(post(CUSTOMERS + "/" + id + "/notes"), "{\"body\":\"Budget is firm\",\"privateNote\":true}")).andExpect(status().isCreated());

		asAdmin(get(CUSTOMERS + "/" + id + "/notes")).andExpect(jsonPath("$.length()").value(2));
		asOther(get(CUSTOMERS + "/" + id + "/notes")).andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].body").value("Prefers mornings"));
		asAdmin(get(CUSTOMERS + "/" + UUID.randomUUID() + "/notes")).andExpect(status().isNotFound());
	}

	// --- consultation requests -----------------------------------------------------------------------------------

	private UUID insertRequest(String name, String status, UUID assignedTo) {
		UUID id = UUID.randomUUID();
		jdbc.sql("insert into crm.consult_request (id, full_name, phone, area_text, budget_max, move_in_date, message, status, "
				+ "assigned_to) values (:id, :name, '0912345678', 'Binh Thanh', 4500000, '2026-12-01', :message, :status, :assigned)")
				.param("id", id).param("name", name).param("message", "Looking for " + name).param("status", status)
				.param("assigned", assignedTo).update();
		return id;
	}

	@Test
	void aConsultationRequestRoundTripsAndIsFilteredNewestFirst() throws Exception {
		String m = marker();
		UUID staff = UUID.randomUUID();
		UUID first = insertRequest("First " + m, "new", null);
		UUID second = insertRequest("Second " + m, "assigned", staff);

		asAdmin(get(REQUESTS + "/" + first)).andExpect(status().isOk()).andExpect(jsonPath("$.fullName").value("First " + m))
				.andExpect(jsonPath("$.areaText").value("Binh Thanh")).andExpect(jsonPath("$.budgetMax").value(4500000))
				.andExpect(jsonPath("$.moveInDate").value("2026-12-01")).andExpect(jsonPath("$.channel").value("web"))
				.andExpect(jsonPath("$.status").value("new")).andExpect(jsonPath("$.createdAt").isNotEmpty());
		asAdmin(get(REQUESTS + "?q=" + m)).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(REQUESTS + "?q=" + m + "&status=assigned")).andExpect(jsonPath("$.items[0].id").value(second.toString()));
		asAdmin(get(REQUESTS + "?q=" + m + "&assignedTo=" + staff)).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(REQUESTS + "/" + UUID.randomUUID())).andExpect(status().isNotFound());
	}

	@Test
	void aRequestIsAssignedWorkedOnAndClosed() throws Exception {
		UUID staff = UUID.randomUUID();
		UUID id = insertRequest("Flow " + marker(), "new", null);
		String assignee = REQUESTS + "/" + id + "/assignee";
		String status = REQUESTS + "/" + id + "/status";

		asAdmin(json(put(status), "{\"status\":\"contacted\"}")).andExpect(status().isConflict());
		asAdmin(json(put(assignee), "{\"userId\":\"" + staff + "\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("assigned"))
				.andExpect(jsonPath("$.assignedTo").value(staff.toString()));
		asAdmin(json(put(assignee), "{\"userId\":null}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("new"));
		asAdmin(json(put(assignee), "{\"userId\":\"" + staff + "\"}")).andExpect(status().isOk());
		asAdmin(json(put(status), "{\"status\":\"contacted\"}")).andExpect(status().isOk());
		asAdmin(json(put(assignee), "{\"userId\":null}")).andExpect(status().isConflict());
		asAdmin(json(put(assignee), "{\"userId\":\"" + UUID.randomUUID() + "\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("contacted"));
		asAdmin(json(put(status), "{\"status\":\"done\"}")).andExpect(status().isOk());
		asAdmin(json(put(status), "{\"status\":\"spam\"}")).andExpect(status().isConflict());
		asAdmin(json(put(assignee), "{\"userId\":\"" + staff + "\"}")).andExpect(status().isConflict());
	}

}
