package vn.tthome.cms.controllers;

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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.cms.CmsIntegrationTestBase;
import vn.tthome.cms.support.TestTokens;

/** The banner, FAQ and menu endpoints against a real PostgreSQL: mapping, filters, ordering and menu rules. */
@AutoConfigureMockMvc
class AdminCmsListsTests extends CmsIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/cms";

	@Autowired
	MockMvc mvc;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String marker() {
		return "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	private static String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	// --- banners -------------------------------------------------------------------------------------------------

	private static String banner(String placement, int sort, boolean active) {
		return "{\"locale\":\"vi\",\"placement\":\"" + placement + "\",\"title\":\" Summer \",\"imageUrl\":\"https://res.cloudinary.com/d/a.jpg\","
				+ "\"mobileImageUrl\":\"https://res.cloudinary.com/d/m.jpg\",\"linkUrl\":\"/promo\",\"sortOrder\":" + sort
				+ ",\"startsAt\":\"2026-06-01T00:00:00Z\",\"endsAt\":\"2026-09-01T00:00:00Z\",\"active\":" + active + "}";
	}

	@Test
	void aBannerRoundTripsEveryFieldAndStaysUnderItsPlacementInOrder() throws Exception {
		String placement = "p_" + marker();

		String second = idOf(asAdmin(json(post(BASE + "/banners"), banner(placement, 2, true))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.title").value("Summer")));
		String first = idOf(asAdmin(json(post(BASE + "/banners"), banner(placement, 1, false))));
		asAdmin(json(post(BASE + "/banners"), banner("other_" + marker(), 0, true))).andExpect(status().isCreated());

		asAdmin(get(BASE + "/banners/" + second)).andExpect(status().isOk()).andExpect(jsonPath("$.locale").value("vi"))
				.andExpect(jsonPath("$.imageUrl").value("https://res.cloudinary.com/d/a.jpg"))
				.andExpect(jsonPath("$.mobileImageUrl").value("https://res.cloudinary.com/d/m.jpg"))
				.andExpect(jsonPath("$.linkUrl").value("/promo")).andExpect(jsonPath("$.sortOrder").value(2))
				.andExpect(jsonPath("$.startsAt").value("2026-06-01T00:00:00Z"))
				.andExpect(jsonPath("$.endsAt").value("2026-09-01T00:00:00Z")).andExpect(jsonPath("$.active").value(true));
		asAdmin(get(BASE + "/banners?placement=" + placement)).andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].id").value(first)).andExpect(jsonPath("$[1].id").value(second));
		asAdmin(get(BASE + "/banners?placement=" + placement + "&active=true")).andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].id").value(second));
		asAdmin(get(BASE + "/banners?placement=" + placement + "&locale=en")).andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void aBannerIsUpdatedAndDeletedAndItsDatesAreChecked() throws Exception {
		String placement = "p_" + marker();
		String id = idOf(asAdmin(json(post(BASE + "/banners"), banner(placement, 1, true))));

		asAdmin(json(put(BASE + "/banners/" + id), banner(placement, 5, false))).andExpect(status().isOk())
				.andExpect(jsonPath("$.sortOrder").value(5)).andExpect(jsonPath("$.active").value(false));
		asAdmin(json(put(BASE + "/banners/" + id), banner(placement, 5, false).replace("2026-09-01", "2026-05-01")))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/banners/" + UUID.randomUUID()), banner(placement, 1, true))).andExpect(status().isNotFound());

		asAdmin(delete(BASE + "/banners/" + id)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/banners/" + id)).andExpect(status().isNotFound());
		asAdmin(delete(BASE + "/banners/" + id)).andExpect(status().isNotFound());
	}

	// --- FAQs ----------------------------------------------------------------------------------------------------

	@Test
	void faqsAreFilteredByAudienceAndOrderedBySortOrder() throws Exception {
		String m = marker();
		String body = "{\"locale\":\"en\",\"audience\":\"%s\",\"question\":\"Q %s %d\",\"answer\":\"A\",\"sortOrder\":%d}";
		String late = idOf(asAdmin(json(post(BASE + "/faqs"), body.formatted("landlord", m, 2, 2))).andExpect(status().isCreated()));
		String early = idOf(asAdmin(json(post(BASE + "/faqs"), body.formatted("landlord", m, 1, 1))));
		asAdmin(json(post(BASE + "/faqs"), body.formatted("tenant", m, 3, 3))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.active").value(true));

		asAdmin(get(BASE + "/faqs?locale=en&audience=landlord")).andExpect(status().isOk())
				.andExpect(jsonPath("$[?(@.id=='" + early + "')]").exists()).andExpect(jsonPath("$[?(@.id=='" + late + "')]").exists());
		asAdmin(get(BASE + "/faqs?locale=en&audience=landlord&active=false")).andExpect(jsonPath("$.length()").value(0));
		asAdmin(json(put(BASE + "/faqs/" + early), body.formatted("all", m, 1, 9))).andExpect(status().isOk())
				.andExpect(jsonPath("$.audience").value("all")).andExpect(jsonPath("$.sortOrder").value(9));
		asAdmin(delete(BASE + "/faqs/" + early)).andExpect(status().isNoContent());
	}

	// --- menu items ----------------------------------------------------------------------------------------------

	private static String menu(String location, String parent, String label, String url) {
		return "{\"locale\":\"vi\",\"location\":\"" + location + "\",\"parentId\":" + (parent == null ? "null" : "\"" + parent + "\"")
				+ ",\"label\":\"" + label + "\",\"url\":\"" + url + "\",\"external\":false,\"sortOrder\":1,\"active\":true}";
	}

	@Test
	void aMenuHasTwoLevelsAndKeepsItsItemsTogether() throws Exception {
		String top = idOf(asAdmin(json(post(BASE + "/menu-items"), menu("footer_company", null, "Company", "/company")))
				.andExpect(status().isCreated()));
		String child = idOf(asAdmin(json(post(BASE + "/menu-items"), menu("footer_company", top, "About", "/about")))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.parentId").value(top)));

		// a third level, an item in another menu, a missing parent and a self parent are all refused
		asAdmin(json(post(BASE + "/menu-items"), menu("footer_company", child, "Deep", "/deep"))).andExpect(status().isBadRequest());
		asAdmin(json(post(BASE + "/menu-items"), menu("header", top, "Elsewhere", "/x"))).andExpect(status().isBadRequest());
		asAdmin(json(post(BASE + "/menu-items"), menu("footer_company", UUID.randomUUID().toString(), "Orphan", "/o")))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/menu-items/" + top), menu("footer_company", top, "Company", "/company")))
				.andExpect(status().isBadRequest());
		// an item with children can neither get a parent nor change menu
		String other = idOf(asAdmin(json(post(BASE + "/menu-items"), menu("footer_company", null, "Other", "/other"))));
		asAdmin(json(put(BASE + "/menu-items/" + top), menu("footer_company", other, "Company", "/company")))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/menu-items/" + top), menu("header", null, "Company", "/company"))).andExpect(status().isBadRequest());

		asAdmin(get(BASE + "/menu-items?locale=vi&location=footer_company"))
				.andExpect(jsonPath("$[?(@.id=='" + child + "')].parentId").value(top));
	}

	@Test
	void anItemWithChildrenCannotBeDeletedUntilTheyAreGone() throws Exception {
		String top = idOf(asAdmin(json(post(BASE + "/menu-items"), menu("footer_connect", null, "Connect", "https://example.com/c")))
				.andExpect(status().isCreated()));
		String child = idOf(asAdmin(json(post(BASE + "/menu-items"), menu("footer_connect", top, "Zalo", "https://zalo.me/x"))));

		asAdmin(delete(BASE + "/menu-items/" + top)).andExpect(status().isConflict());

		asAdmin(delete(BASE + "/menu-items/" + child)).andExpect(status().isNoContent());
		asAdmin(delete(BASE + "/menu-items/" + top)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/menu-items/" + top)).andExpect(status().isNotFound());
	}

}
