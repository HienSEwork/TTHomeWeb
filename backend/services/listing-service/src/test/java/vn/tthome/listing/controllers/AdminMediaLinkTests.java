package vn.tthome.listing.controllers;

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

import vn.tthome.listing.ListingIntegrationTestBase;
import vn.tthome.listing.support.TestTokens;

/** The gallery endpoints against a real PostgreSQL: ordering, the unique (owner, asset) pair and covers. */
@AutoConfigureMockMvc
class AdminMediaLinkTests extends ListingIntegrationTestBase {

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

	private static String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	private static String item(UUID asset, String kind, boolean cover) {
		return "{\"assetId\":\"" + asset + "\",\"kind\":\"" + kind + "\",\"cover\":" + cover + "}";
	}

	private String newProject() throws Exception {
		return idOf(asAdmin(json(post("/api/v1/admin/projects"),
				"{\"name\":\"Gallery " + UUID.randomUUID() + "\",\"petPolicy\":\"none\"}")).andExpect(status().isCreated()));
	}

	private String newRoom(String project) throws Exception {
		return idOf(asAdmin(json(post("/api/v1/admin/projects/" + project + "/rooms"),
				"{\"code\":\"101\",\"title\":\"Room\",\"roomType\":\"studio\",\"price\":1}")).andExpect(status().isCreated()));
	}

	@Test
	void aProjectGalleryKeepsItsOrderAndSetsTheCoverAndTheVideo() throws Exception {
		String project = newProject();
		UUID plan = UUID.randomUUID();
		UUID photo = UUID.randomUUID();
		UUID clip = UUID.randomUUID();

		asAdmin(json(put("/api/v1/admin/projects/" + project + "/media"),
				"{\"items\":[" + item(plan, "floorplan", false) + "," + item(photo, "photo", true) + "," + item(clip, "video", false)
						+ "]}")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(3))
				.andExpect(jsonPath("$[0].assetId").value(plan.toString())).andExpect(jsonPath("$[1].cover").value(true));

		asAdmin(get("/api/v1/admin/projects/" + project + "/media")).andExpect(jsonPath("$[0].kind").value("floorplan"))
				.andExpect(jsonPath("$[1].sortOrder").value(1)).andExpect(jsonPath("$[2].kind").value("video"));
		asAdmin(get("/api/v1/admin/projects/" + project)).andExpect(jsonPath("$.coverAssetId").value(photo.toString()))
				.andExpect(jsonPath("$.videoAssetId").value(clip.toString()));
	}

	@Test
	void replacingTheGalleryReusesAssetsAndDropsTheRest() throws Exception {
		String project = newProject();
		UUID keep = UUID.randomUUID();
		UUID drop = UUID.randomUUID();
		String url = "/api/v1/admin/projects/" + project + "/media";
		asAdmin(json(put(url), "{\"items\":[" + item(drop, "photo", false) + "," + item(keep, "photo", true) + "]}"))
				.andExpect(status().isOk());

		asAdmin(json(put(url), "{\"items\":[" + item(keep, "photo", true) + "]}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].sortOrder").value(0));

		assertThat(jdbc.sql("select count(*) from inventory.media_link where owner_id = cast(:id as uuid)")
				.param("id", project).query(Integer.class).single()).isEqualTo(1);
		asAdmin(json(put(url), "{\"items\":[]}")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
		asAdmin(get("/api/v1/admin/projects/" + project)).andExpect(jsonPath("$.coverAssetId").doesNotExist())
				.andExpect(jsonPath("$.videoAssetId").doesNotExist());
	}

	@Test
	void aRoomGalleryIsIndependentOfTheProjectGalleryAndSetsTheRoomCover() throws Exception {
		String project = newProject();
		String room = newRoom(project);
		UUID asset = UUID.randomUUID();
		asAdmin(json(put("/api/v1/admin/projects/" + project + "/media"), "{\"items\":[" + item(asset, "photo", true) + "]}"))
				.andExpect(status().isOk());

		asAdmin(json(put("/api/v1/admin/rooms/" + room + "/media"), "{\"items\":[" + item(asset, "photo", true) + "]}"))
				.andExpect(status().isOk());

		asAdmin(get("/api/v1/admin/rooms/" + room)).andExpect(jsonPath("$.coverAssetId").value(asset.toString()));
		asAdmin(get("/api/v1/admin/rooms/" + room + "/media")).andExpect(jsonPath("$.length()").value(1));
		asAdmin(get("/api/v1/admin/projects/" + project + "/media")).andExpect(jsonPath("$.length()").value(1));
	}

	@Test
	void invalidGalleriesAreRefusedAndLeaveTheStoredOneUntouched() throws Exception {
		String project = newProject();
		UUID asset = UUID.randomUUID();
		String url = "/api/v1/admin/projects/" + project + "/media";
		asAdmin(json(put(url), "{\"items\":[" + item(asset, "photo", true) + "]}")).andExpect(status().isOk());

		asAdmin(json(put(url), "{\"items\":[" + item(asset, "photo", false) + "," + item(asset, "video", false) + "]}"))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(url), "{\"items\":[" + item(UUID.randomUUID(), "photo", true) + "," + item(UUID.randomUUID(), "photo", true)
				+ "]}")).andExpect(status().isBadRequest());
		asAdmin(json(put(url), "{\"items\":[" + item(UUID.randomUUID(), "video", true) + "]}"))
				.andExpect(status().isBadRequest());

		asAdmin(get(url)).andExpect(jsonPath("$.length()").value(1)).andExpect(jsonPath("$[0].assetId").value(asset.toString()));
		asAdmin(get("/api/v1/admin/projects/" + UUID.randomUUID() + "/media")).andExpect(status().isNotFound());
		asAdmin(get("/api/v1/admin/rooms/" + UUID.randomUUID() + "/media")).andExpect(status().isNotFound());
	}

}
