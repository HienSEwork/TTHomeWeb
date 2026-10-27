package vn.tthome.media.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.matchesPattern;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import vn.tthome.media.MediaIntegrationTestBase;
import vn.tthome.media.support.TestTokens;

/** The media endpoints against a real PostgreSQL: the mapping, the register and the signed upload parameters. */
@AutoConfigureMockMvc
class AdminMediaTests extends MediaIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/media";

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

	private static String marker() {
		return "m" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
	}

	private static String assetBody(String publicId, String type, String folder, String alt) {
		return "{\"publicId\":\"" + publicId + "\",\"resourceType\":\"" + type + "\",\"format\":\"jpg\",\"bytes\":123456,"
				+ "\"width\":800,\"height\":600,\"durationSec\":12.34,\"version\":1700000000,"
				+ "\"secureUrl\":\"https://res.cloudinary.com/demo-cloud/" + type + "/upload/v1700000000/" + publicId + ".jpg\","
				+ "\"folder\":\"" + folder + "\",\"altText\":\"" + alt + "\"}";
	}

	private String register(String publicId, String type, String folder, String alt) throws Exception {
		return asAdmin(json(post(BASE + "/assets"), assetBody(publicId, type, folder, alt))).andExpect(status().isCreated())
				.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	@Test
	void anUploadSignatureCarriesTheUploadParametersButNotTheSecret() throws Exception {
		asAdmin(json(post(BASE + "/upload-signature"), "{\"folder\":\"tthome/projects/PRJ-abc\",\"resourceType\":\"video\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.uploadUrl").value("https://api.cloudinary.com/v1_1/demo-cloud/video/upload"))
				.andExpect(jsonPath("$.cloudName").value("demo-cloud")).andExpect(jsonPath("$.apiKey").value("123456789012345"))
				.andExpect(jsonPath("$.folder").value("tthome/projects/PRJ-abc"))
				.andExpect(jsonPath("$.signature").value(matchesPattern("[0-9a-f]{40}")))
				.andExpect(jsonPath("$.timestamp").isNumber()).andExpect(jsonPath("$.apiSecret").doesNotExist());
	}

	@Test
	void aRegisteredAssetRoundTripsEveryFieldAndRemembersWhoUploadedIt() throws Exception {
		String publicId = "tthome/projects/" + marker();

		String id = register(publicId, "image", "tthome/projects", "Front view");

		asAdmin(get(BASE + "/assets/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.publicId").value(publicId))
				.andExpect(jsonPath("$.resourceType").value("image")).andExpect(jsonPath("$.format").value("jpg"))
				.andExpect(jsonPath("$.bytes").value(123456)).andExpect(jsonPath("$.width").value(800))
				.andExpect(jsonPath("$.height").value(600)).andExpect(jsonPath("$.durationSec").value(12.34))
				.andExpect(jsonPath("$.version").value(1700000000)).andExpect(jsonPath("$.folder").value("tthome/projects"))
				.andExpect(jsonPath("$.altText").value("Front view")).andExpect(jsonPath("$.uploadedBy").isNotEmpty());
		assertThat(jdbc.sql("select source from media.asset where id = cast(:id as uuid)").param("id", id)
				.query(String.class).single()).isEqualTo("upload");
	}

	@Test
	void aPublicIdIsRegisteredOnceEvenAfterTheAssetIsDeleted() throws Exception {
		String publicId = "tthome/rooms/" + marker();
		String id = register(publicId, "image", "tthome/rooms", "x");

		asAdmin(json(post(BASE + "/assets"), assetBody(publicId, "image", "tthome/rooms", "x"))).andExpect(status().isConflict());

		asAdmin(delete(BASE + "/assets/" + id)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/assets/" + id)).andExpect(status().isNotFound());
		asAdmin(delete(BASE + "/assets/" + id)).andExpect(status().isNotFound());
		asAdmin(json(post(BASE + "/assets"), assetBody(publicId, "image", "tthome/rooms", "x"))).andExpect(status().isConflict());
	}

	@Test
	void aUrlOfAnotherAccountIsRefused() throws Exception {
		String body = assetBody("tthome/x/" + marker(), "image", "tthome/x", "x").replace("demo-cloud", "someone-else");

		asAdmin(json(post(BASE + "/assets"), body)).andExpect(status().isBadRequest())
				.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
	}

	@Test
	void listFiltersByFolderPrefixTypeAndTextAndPages() throws Exception {
		String m = marker();
		String root = "tthome/list/" + m;
		register(root + "/one", "image", root, "Sunny " + m);
		register(root + "/two", "image", root + "/sub", "Dark");
		register(root + "/clip", "video", root, "Walkthrough");
		register("tthome/list/other-" + m, "image", "tthome/list/other-" + m, "Elsewhere");

		asAdmin(get(BASE + "/assets?folder=" + root)).andExpect(jsonPath("$.total").value(3));
		asAdmin(get(BASE + "/assets?folder=" + root + "&resourceType=image")).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(BASE + "/assets?folder=" + root + "/sub")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "/assets?q=SUNNY " + m)).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "/assets?folder=" + root + "&size=2&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.total").value(3));
		asAdmin(get(BASE + "/assets?folder=tthome/list/" + m.substring(0, 5) + "_" + m.substring(6)))
				.andExpect(jsonPath("$.total").value(0));
	}

}
