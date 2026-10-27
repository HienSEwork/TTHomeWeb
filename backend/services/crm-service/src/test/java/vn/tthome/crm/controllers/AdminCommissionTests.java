package vn.tthome.crm.controllers;

import static org.assertj.core.api.Assertions.assertThat;
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

/** Collaborators and commissions against a real PostgreSQL, including the V2 migration. */
@AutoConfigureMockMvc
class AdminCommissionTests extends CrmIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/crm";

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private final UUID admin = UUID.randomUUID();

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.bearerFor(admin, "ADMIN")));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private UUID customer(String stage, UUID referrer) {
		UUID id = UUID.randomUUID();
		jdbc.sql("insert into crm.customer (id, full_name, source, stage, referrer_user_id) values (:id, 'Referred', 'ctv', :stage, :ref)")
				.param("id", id).param("stage", stage).param("ref", referrer).update();
		return id;
	}

	private static String create(UUID customer, long amount) {
		return "{\"customerId\":\"" + customer + "\",\"amount\":" + amount + ",\"note\":\" First month \"}";
	}

	private static String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	@Test
	void theCommissionTableExistsAfterTheMigration() {
		assertThat(jdbc.sql("select count(*) from information_schema.tables where table_schema = 'crm' and table_name = 'commission'")
				.query(Integer.class).single()).isEqualTo(1);
		assertThat(jdbc.sql("select count(*) from pg_trigger where tgname = 'trg_updated_at' and tgrelid = 'crm.commission'::regclass")
				.query(Integer.class).single()).isEqualTo(1);
	}

	@Test
	void aCommissionGoesToTheReferrerOfARentedCustomerOnlyOnce() throws Exception {
		UUID referrer = UUID.randomUUID();
		UUID rented = customer("rented", referrer);
		UUID viewing = customer("viewing", referrer);
		UUID loner = customer("rented", null);

		String id = idOf(asAdmin(json(post(BASE + "/commissions"), create(rented, 750_000))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.referrerUserId").value(referrer.toString())).andExpect(jsonPath("$.status").value("pending"))
				.andExpect(jsonPath("$.amount").value(750000)).andExpect(jsonPath("$.note").value("First month"))
				.andExpect(jsonPath("$.createdBy").value(admin.toString())));

		asAdmin(json(post(BASE + "/commissions"), create(rented, 1))).andExpect(status().isConflict());
		asAdmin(json(post(BASE + "/commissions"), create(viewing, 1))).andExpect(status().isBadRequest());
		asAdmin(json(post(BASE + "/commissions"), create(loner, 1))).andExpect(status().isBadRequest());
		asAdmin(json(post(BASE + "/commissions"), create(UUID.randomUUID(), 1))).andExpect(status().isNotFound());
		asAdmin(get(BASE + "/commissions/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.customerId").value(rented.toString()))
				.andExpect(jsonPath("$.createdAt").isNotEmpty());
		asAdmin(get(BASE + "/commissions/" + UUID.randomUUID())).andExpect(status().isNotFound());
	}

	@Test
	void aCommissionIsEditedApprovedPaidAndThenFinalAndACancelledOneFreesTheCustomer() throws Exception {
		UUID referrer = UUID.randomUUID();
		UUID customer = customer("rented", referrer);
		String id = idOf(asAdmin(json(post(BASE + "/commissions"), create(customer, 500_000))).andExpect(status().isCreated()));
		String url = BASE + "/commissions/" + id;

		asAdmin(json(put(url), "{\"amount\":600000,\"note\":null}")).andExpect(status().isOk()).andExpect(jsonPath("$.amount").value(600000))
				.andExpect(jsonPath("$.note").doesNotExist());
		asAdmin(json(put(url + "/status"), "{\"status\":\"paid\"}")).andExpect(status().isConflict());
		asAdmin(json(put(url + "/status"), "{\"status\":\"approved\"}")).andExpect(status().isOk());
		asAdmin(json(put(url), "{\"amount\":1}")).andExpect(status().isConflict());
		asAdmin(json(put(url + "/status"), "{\"status\":\"paid\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.paidAt").isNotEmpty());
		asAdmin(json(put(url + "/status"), "{\"status\":\"cancelled\"}")).andExpect(status().isConflict());

		UUID second = customer("rented", referrer);
		String cancelled = idOf(asAdmin(json(post(BASE + "/commissions"), create(second, 100_000))).andExpect(status().isCreated()));
		asAdmin(json(put(BASE + "/commissions/" + cancelled + "/status"), "{\"status\":\"cancelled\"}")).andExpect(status().isOk());
		asAdmin(json(post(BASE + "/commissions"), create(second, 200_000))).andExpect(status().isCreated());
	}

	@Test
	void commissionsAreListedAndFiltered() throws Exception {
		UUID referrer = UUID.randomUUID();
		UUID a = customer("rented", referrer);
		UUID b = customer("rented", referrer);
		String first = idOf(asAdmin(json(post(BASE + "/commissions"), create(a, 100_000))));
		String second = idOf(asAdmin(json(post(BASE + "/commissions"), create(b, 200_000))));
		asAdmin(json(put(BASE + "/commissions/" + first + "/status"), "{\"status\":\"approved\"}")).andExpect(status().isOk());

		asAdmin(get(BASE + "/commissions?referrerUserId=" + referrer)).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].id").value(second)).andExpect(jsonPath("$.items[1].id").value(first));
		asAdmin(get(BASE + "/commissions?referrerUserId=" + referrer + "&status=approved")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "/commissions?customerId=" + b)).andExpect(jsonPath("$.items[0].id").value(second));
		asAdmin(get(BASE + "/commissions?referrerUserId=" + referrer + "&size=1&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.total").value(2));
	}

	@Test
	void collaboratorsAreSummarisedWithTheirCustomersAndCommissions() throws Exception {
		UUID busy = UUID.randomUUID();
		UUID quiet = UUID.randomUUID();
		UUID rented = customer("rented", busy);
		UUID other = customer("rented", busy);
		customer("new", busy);
		customer("new", quiet);
		jdbc.sql("insert into crm.customer (id, full_name, source, stage, referrer_user_id, deleted_at) values (gen_random_uuid(), 'Gone', "
				+ "'ctv', 'rented', :ref, now())").param("ref", busy).update();
		String owed = idOf(asAdmin(json(post(BASE + "/commissions"), create(rented, 300_000))));
		String paid = idOf(asAdmin(json(post(BASE + "/commissions"), create(other, 400_000))));
		asAdmin(json(put(BASE + "/commissions/" + paid + "/status"), "{\"status\":\"approved\"}")).andExpect(status().isOk());
		asAdmin(json(put(BASE + "/commissions/" + paid + "/status"), "{\"status\":\"paid\"}")).andExpect(status().isOk());

		asAdmin(get(BASE + "/collaborators?referrerUserId=" + busy)).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].referrerUserId").value(busy.toString())).andExpect(jsonPath("$.items[0].customers").value(3))
				.andExpect(jsonPath("$.items[0].rented").value(2)).andExpect(jsonPath("$.items[0].commissionOwed").value(300000))
				.andExpect(jsonPath("$.items[0].commissionPaid").value(400000));
		asAdmin(get(BASE + "/collaborators?referrerUserId=" + quiet)).andExpect(jsonPath("$.items[0].customers").value(1))
				.andExpect(jsonPath("$.items[0].rented").value(0)).andExpect(jsonPath("$.items[0].commissionOwed").value(0));
		asAdmin(get(BASE + "/collaborators?size=1&page=0")).andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(1));
		assertThat(owed).isNotBlank();
	}

	@Test
	void customersCanBeListedByTheirReferrer() throws Exception {
		UUID referrer = UUID.randomUUID();
		UUID mine = customer("new", referrer);
		customer("new", UUID.randomUUID());

		asAdmin(get(BASE + "/customers?referrerUserId=" + referrer)).andExpect(jsonPath("$.total").value(1))
				.andExpect(jsonPath("$.items[0].id").value(mine.toString())).andExpect(jsonPath("$.items[0].referrerUserId").value(referrer.toString()));
	}

}
