package vn.tthome.listing.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;

import vn.tthome.listing.ListingIntegrationTestBase;
import vn.tthome.listing.support.TestTokens;

/** The catalog endpoints against a real PostgreSQL: queries, constraints and references. */
@AutoConfigureMockMvc
class AdminCatalogTests extends ListingIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/catalog";
	private static final AtomicInteger IDS = new AtomicInteger(900_000);

	@Autowired
	MockMvc mvc;
	@Autowired
	JdbcClient jdbc;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static String slug() {
		return "s" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	private static String unitJson(int id, Integer parent, int level, String scheme, String name, String slug) {
		return "{\"id\":" + id + ",\"parentId\":" + parent + ",\"level\":" + level + ",\"scheme\":\"" + scheme
				+ "\",\"name\":\"" + name + "\",\"slug\":\"" + slug + "\",\"centerLat\":10.5,\"centerLng\":106.5}";
	}

	private ResultActions createUnit(int id, Integer parent, int level, String scheme, String name, String slug)
			throws Exception {
		return asAdmin(json(post(BASE + "/areas"), unitJson(id, parent, level, scheme, name, slug)));
	}

	// --- administrative units ------------------------------------------------------------------------------------

	@Test
	void anAreaTreeIsBuiltFromProvinceToWardAndRejectsBadShapes() throws Exception {
		int province = IDS.incrementAndGet();
		int district = IDS.incrementAndGet();
		int ward = IDS.incrementAndGet();

		createUnit(province, null, 1, "pre_2025", "Province", slug()).andExpect(status().isCreated())
				.andExpect(jsonPath("$.id").value(province)).andExpect(jsonPath("$.parentId").doesNotExist());
		createUnit(district, province, 2, "pre_2025", "District", slug()).andExpect(status().isCreated())
				.andExpect(jsonPath("$.parentId").value(province));
		createUnit(ward, district, 3, "pre_2025", "Ward", slug()).andExpect(status().isCreated());

		createUnit(IDS.incrementAndGet(), province, 3, "pre_2025", "Skips a level", slug()).andExpect(status().isBadRequest());
		createUnit(IDS.incrementAndGet(), province, 2, "post_2025", "Other scheme", slug()).andExpect(status().isBadRequest());
		createUnit(IDS.incrementAndGet(), null, 2, "pre_2025", "No parent", slug()).andExpect(status().isBadRequest());
		createUnit(IDS.incrementAndGet(), 999_999_999, 2, "pre_2025", "Unknown parent", slug())
				.andExpect(status().isBadRequest());
		createUnit(IDS.incrementAndGet(), district, 1, "pre_2025", "Province with parent", slug())
				.andExpect(status().isBadRequest());
	}

	@Test
	void idsAreUniqueAndSlugsAreUniqueUnderOneParent() throws Exception {
		int province = IDS.incrementAndGet();
		String slug = slug();
		createUnit(province, null, 1, "pre_2025", "First", slug).andExpect(status().isCreated());

		createUnit(province, null, 1, "pre_2025", "Same id", slug()).andExpect(status().isConflict());
		createUnit(IDS.incrementAndGet(), null, 1, "pre_2025", "Same slug, same scheme", slug)
				.andExpect(status().isConflict());
		createUnit(IDS.incrementAndGet(), null, 1, "post_2025", "Same slug, other scheme", slug)
				.andExpect(status().isCreated());
		int district = IDS.incrementAndGet();
		createUnit(district, province, 2, "pre_2025", "District", slug).andExpect(status().isCreated());
		createUnit(IDS.incrementAndGet(), province, 2, "pre_2025", "Sibling", slug).andExpect(status().isConflict());
	}

	@Test
	void listFiltersPagesAndOrders() throws Exception {
		int province = IDS.incrementAndGet();
		String marker = slug();
		createUnit(province, null, 1, "pre_2025", "Zeta " + marker, "z-" + marker).andExpect(status().isCreated());
		int b = IDS.incrementAndGet();
		int a = IDS.incrementAndGet();
		createUnit(b, province, 2, "pre_2025", "Beta " + marker, "b-" + marker).andExpect(status().isCreated());
		createUnit(a, province, 2, "pre_2025", "Alpha " + marker, "a-" + marker).andExpect(status().isCreated());

		asAdmin(get(BASE + "/areas?q=" + marker.toUpperCase())).andExpect(jsonPath("$.total").value(3))
				.andExpect(jsonPath("$.items[0].id").value(province)).andExpect(jsonPath("$.items[1].id").value(a))
				.andExpect(jsonPath("$.items[2].id").value(b));
		asAdmin(get(BASE + "/areas?q=" + marker + "&level=2")).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(BASE + "/areas?q=" + marker + "&parentId=" + province)).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(BASE + "/areas?q=" + marker + "&scheme=post_2025")).andExpect(jsonPath("$.total").value(0));
		asAdmin(get(BASE + "/areas?q=" + marker + "&size=2&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].id").value(b)).andExpect(jsonPath("$.total").value(3));
		asAdmin(get(BASE + "/areas?q=" + marker.substring(0, 5) + "_" + marker.substring(6)))
				.andExpect(jsonPath("$.total").value(0));
	}

	@Test
	void updateChangesNamingOnlyAndKeepsTheSlugUnique() throws Exception {
		int province = IDS.incrementAndGet();
		int one = IDS.incrementAndGet();
		int two = IDS.incrementAndGet();
		String slugOne = slug();
		String slugTwo = slug();
		createUnit(province, null, 1, "pre_2025", "P", slug()).andExpect(status().isCreated());
		createUnit(one, province, 2, "pre_2025", "One", slugOne).andExpect(status().isCreated());
		createUnit(two, province, 2, "pre_2025", "Two", slugTwo).andExpect(status().isCreated());

		asAdmin(json(put(BASE + "/areas/" + one), "{\"name\":\" Renamed \",\"slug\":\"" + slugOne + "\",\"centerLat\":1.5}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Renamed"))
				.andExpect(jsonPath("$.centerLat").value(1.5)).andExpect(jsonPath("$.centerLng").doesNotExist())
				.andExpect(jsonPath("$.parentId").value(province)).andExpect(jsonPath("$.level").value(2));
		asAdmin(json(put(BASE + "/areas/" + one), "{\"name\":\"X\",\"slug\":\"" + slugTwo + "\"}"))
				.andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/areas/" + IDS.incrementAndGet()), "{\"name\":\"X\",\"slug\":\"x\"}"))
				.andExpect(status().isNotFound());
	}

	@Test
	void aUnitCanBeDeletedOnlyWhenNothingPointsAtIt() throws Exception {
		int province = IDS.incrementAndGet();
		int district = IDS.incrementAndGet();
		int usedByProject = IDS.incrementAndGet();
		int mapped = IDS.incrementAndGet();
		int counted = IDS.incrementAndGet();
		int free = IDS.incrementAndGet();
		createUnit(province, null, 1, "pre_2025", "P", slug()).andExpect(status().isCreated());
		createUnit(district, province, 2, "pre_2025", "D", slug()).andExpect(status().isCreated());
		for (int id : new int[] { usedByProject, mapped, counted, free }) {
			createUnit(id, district, 3, "pre_2025", "W" + id, slug()).andExpect(status().isCreated());
		}
		jdbc.sql("insert into inventory.project (code, name, slug, ward_id) values (:code, 'P', :slug, :ward)")
				.param("code", "PRJ-" + slug()).param("slug", slug()).param("ward", usedByProject).update();
		jdbc.sql("insert into inventory.admin_unit_map (old_id, new_id) values (:old, :new)").param("old", mapped)
				.param("new", free).update();
		jdbc.sql("insert into inventory.area_stats (admin_unit_id, scheme) values (:id, 'pre_2025')")
				.param("id", counted).update();

		asAdmin(delete(BASE + "/areas/" + province)).andExpect(status().isConflict());
		asAdmin(delete(BASE + "/areas/" + usedByProject)).andExpect(status().isConflict());
		asAdmin(delete(BASE + "/areas/" + mapped)).andExpect(status().isConflict());
		asAdmin(delete(BASE + "/areas/" + counted)).andExpect(status().isConflict());
		asAdmin(delete(BASE + "/areas/" + free)).andExpect(status().isConflict()); // the target of a mapping
		asAdmin(get(BASE + "/areas/" + usedByProject)).andExpect(status().isOk());

		jdbc.sql("delete from inventory.admin_unit_map where old_id = :id").param("id", mapped).update();
		asAdmin(delete(BASE + "/areas/" + free)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/areas/" + free)).andExpect(status().isNotFound());
		asAdmin(delete(BASE + "/areas/" + free)).andExpect(status().isNotFound());
	}

	// --- amenities -----------------------------------------------------------------------------------------------

	@Test
	void theSeededAmenitiesAndLandmarksAreListedInDisplayOrder() throws Exception {
		asAdmin(get(BASE + "/amenities")).andExpect(status().isOk())
				.andExpect(jsonPath("$[*].code", hasItems("window", "balcony", "elevator", "parking")))
				.andExpect(jsonPath("$[0].code").value("window"));
		asAdmin(get(BASE + "/landmarks")).andExpect(status().isOk())
				.andExpect(jsonPath("$[*].code", hasItems("rmit", "bachkhoa", "landmark81")));
	}

	@Test
	void anAmenityIsCreatedWithTheNextIdUpdatedAndDeleted() throws Exception {
		String code = "t_" + slug().substring(1, 9);
		String body = "{\"code\":\"" + code + "\",\"name\":\" Test \",\"scope\":\"room\",\"icon\":\"i\","
				+ "\"sortOrder\":99,\"filter\":false}";

		String created = asAdmin(json(post(BASE + "/amenities"), body)).andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Test")).andExpect(jsonPath("$.filter").value(false)).andReturn()
				.getResponse().getContentAsString();
		String id = created.replaceAll(".*\"id\":(\\d+).*", "$1");

		asAdmin(json(post(BASE + "/amenities"), body)).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/amenities/" + id), body.replace("room", "both"))).andExpect(status().isOk())
				.andExpect(jsonPath("$.scope").value("both"));
		asAdmin(get(BASE + "/amenities/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.code").value(code));
		asAdmin(delete(BASE + "/amenities/" + id)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/amenities/" + id)).andExpect(status().isNotFound());
	}

	@Test
	void anAmenityCodeCannotBeTakenFromAnotherAmenity() throws Exception {
		String taken = "t_" + slug().substring(1, 9);
		String other = "t_" + slug().substring(1, 9);
		String template = "{\"code\":\"%s\",\"name\":\"N\",\"scope\":\"room\",\"sortOrder\":1,\"filter\":true}";
		asAdmin(json(post(BASE + "/amenities"), template.formatted(taken))).andExpect(status().isCreated());
		String id = asAdmin(json(post(BASE + "/amenities"), template.formatted(other))).andReturn().getResponse()
				.getContentAsString().replaceAll(".*\"id\":(\\d+).*", "$1");

		asAdmin(json(put(BASE + "/amenities/" + id), template.formatted(taken))).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/amenities/" + id), template.formatted(other))).andExpect(status().isOk());
	}

	@Test
	void anAmenityInUseCannotBeDeleted() throws Exception {
		String code = "t_" + slug().substring(1, 9);
		String id = asAdmin(json(post(BASE + "/amenities"), "{\"code\":\"" + code
				+ "\",\"name\":\"N\",\"scope\":\"project\",\"sortOrder\":1,\"filter\":true}")).andReturn().getResponse()
				.getContentAsString().replaceAll(".*\"id\":(\\d+).*", "$1");
		UUID project = UUID.randomUUID();
		jdbc.sql("insert into inventory.project (id, code, name, slug) values (:id, :code, 'P', :slug)")
				.param("id", project).param("code", "PRJ-" + slug()).param("slug", slug()).update();
		jdbc.sql("insert into inventory.project_amenity (project_id, amenity_id) values (:p, :a)").param("p", project)
				.param("a", Short.parseShort(id)).update();

		asAdmin(delete(BASE + "/amenities/" + id)).andExpect(status().isConflict());

		jdbc.sql("delete from inventory.project_amenity where project_id = :p").param("p", project).update();
		asAdmin(delete(BASE + "/amenities/" + id)).andExpect(status().isNoContent());
	}

	// --- landmarks -----------------------------------------------------------------------------------------------

	@Test
	void aLandmarkIsCreatedUpdatedAndDeleted() throws Exception {
		String code = "l_" + slug().substring(1, 9);
		String body = "{\"code\":\"" + code + "\",\"name\":\" Campus \",\"kind\":\"university\",\"lat\":10.77,"
				+ "\"lng\":106.66,\"radiusM\":2500,\"sortOrder\":50}";

		String id = asAdmin(json(post(BASE + "/landmarks"), body)).andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("Campus")).andExpect(jsonPath("$.radiusM").value(2500)).andReturn()
				.getResponse().getContentAsString().replaceAll(".*\"id\":(\\d+).*", "$1");

		asAdmin(json(post(BASE + "/landmarks"), body)).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/landmarks/" + id), body.replace("university", "mall").replace("2500", "4000")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.kind").value("mall"))
				.andExpect(jsonPath("$.radiusM").value(4000));
		assertThat(jdbc.sql("select kind from inventory.landmark where id = :id").param("id", Short.parseShort(id))
				.query(String.class).single()).isEqualTo("mall");
		asAdmin(delete(BASE + "/landmarks/" + id)).andExpect(status().isNoContent());
		asAdmin(delete(BASE + "/landmarks/" + id)).andExpect(status().isNotFound());
	}

}
