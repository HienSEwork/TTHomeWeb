package vn.tthome.cms.controllers;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.cms.CmsIntegrationTestBase;
import vn.tthome.cms.support.TestTokens;

/** The post endpoints against a real PostgreSQL: mapping, tags, categories, scheduling and soft delete. */
@AutoConfigureMockMvc
class AdminPostTests extends CmsIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/cms/posts";

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

	private static String idOf(ResultActions result) throws Exception {
		return result.andReturn().getResponse().getContentAsString().replaceAll("^\\{\"id\":\"([0-9a-f-]{36})\".*", "$1");
	}

	private String newCategory(String locale) throws Exception {
		return idOf(asAdmin(json(post("/api/v1/admin/cms/categories"), "{\"locale\":\"" + locale + "\",\"name\":\"Cat\",\"slug\":\"c-"
				+ marker() + "\",\"sortOrder\":1}")).andExpect(status().isCreated()));
	}

	private String newTag(String locale) throws Exception {
		return idOf(asAdmin(json(post("/api/v1/admin/cms/tags"), "{\"locale\":\"" + locale + "\",\"name\":\"Tag\",\"slug\":\"t-"
				+ marker() + "\"}")).andExpect(status().isCreated()));
	}

	private static String body(String locale, String title, String slug, String status, String publishedAt, String category,
			String tags) {
		return "{\"locale\":\"" + locale + "\",\"categoryId\":" + (category == null ? "null" : "\"" + category + "\"")
				+ ",\"authorName\":\" Writer \",\"title\":\"" + title + "\",\"slug\":" + (slug == null ? "null" : "\"" + slug + "\"")
				+ ",\"excerpt\":\"Short\",\"content\":\"<p onclick=\\\"x()\\\">Hello</p><script>alert(1)</script>\","
				+ "\"coverUrl\":\"https://res.cloudinary.com/demo/a.jpg\",\"status\":\"" + status + "\",\"publishedAt\":"
				+ (publishedAt == null ? "null" : "\"" + publishedAt + "\"") + ",\"tagIds\":[" + (tags == null ? "" : tags) + "]}";
	}

	@Test
	void aPostRoundTripsEveryFieldWithSanitizedContentAndTheAuthorFromTheToken() throws Exception {
		String category = newCategory("vi");
		String tag = newTag("vi");
		String title = "Nhà trọ " + marker();

		String id = idOf(asAdmin(json(post(BASE), body("vi", title, null, "draft", null, category, "\"" + tag + "\"")))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.content").value("<p>Hello</p>"))
				.andExpect(jsonPath("$.authorId").isNotEmpty()).andExpect(jsonPath("$.readMinutes").value(1)));

		asAdmin(get(BASE + "/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.title").value(title))
				.andExpect(jsonPath("$.slug").value(org.hamcrest.Matchers.startsWith("nha-tro-m")))
				.andExpect(jsonPath("$.categoryId").value(category)).andExpect(jsonPath("$.tagIds[0]").value(tag))
				.andExpect(jsonPath("$.authorName").value("Writer")).andExpect(jsonPath("$.excerpt").value("Short"))
				.andExpect(jsonPath("$.coverUrl").value("https://res.cloudinary.com/demo/a.jpg"))
				.andExpect(jsonPath("$.status").value("draft")).andExpect(jsonPath("$.publishedAt").doesNotExist())
				.andExpect(jsonPath("$.viewCount").value(0));
		assertThat(jdbc.sql("select content from cms.post where id = cast(:id as uuid)").param("id", id).query(String.class).single())
				.doesNotContain("script", "onclick");
	}

	@Test
	void slugsAreUniquePerLanguageEvenAfterADeleteAndATitleWithoutASlugGetsANumber() throws Exception {
		String title = "Same " + marker();
		String first = idOf(asAdmin(json(post(BASE), body("vi", title, null, "draft", null, null, null))).andExpect(status().isCreated()));
		String slug = jdbc.sql("select slug from cms.post where id = cast(:id as uuid)").param("id", first).query(String.class).single();

		asAdmin(json(post(BASE), body("vi", title, null, "draft", null, null, null))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.slug").value(slug + "-2"));
		asAdmin(json(post(BASE), body("vi", "Other", slug, "draft", null, null, null))).andExpect(status().isConflict());
		asAdmin(json(post(BASE), body("en", title, slug, "draft", null, null, null))).andExpect(status().isCreated());

		asAdmin(delete(BASE + "/" + first)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/" + first)).andExpect(status().isNotFound());
		asAdmin(json(post(BASE), body("vi", "Other", slug, "draft", null, null, null))).andExpect(status().isConflict());
		asAdmin(delete(BASE + "/" + first)).andExpect(status().isNotFound());
	}

	@Test
	void theStatusMovesThroughDraftScheduledPublishedAndArchived() throws Exception {
		String id = idOf(asAdmin(json(post(BASE), body("vi", "Flow " + marker(), null, "draft", null, null, null)))
				.andExpect(status().isCreated()));
		String later = Instant.now().plusSeconds(86400).toString();
		String url = BASE + "/" + id + "/status";

		asAdmin(json(put(url), "{\"status\":\"scheduled\"}")).andExpect(status().isBadRequest());
		asAdmin(json(put(url), "{\"status\":\"scheduled\",\"publishedAt\":\"2020-01-01T00:00:00Z\"}")).andExpect(status().isBadRequest());
		asAdmin(json(put(url), "{\"status\":\"scheduled\",\"publishedAt\":\"" + later + "\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("scheduled")).andExpect(jsonPath("$.publishedAt").isNotEmpty());

		String published = asAdmin(json(put(url), "{\"status\":\"published\",\"publishedAt\":\"2026-01-02T03:04:05Z\"}"))
				.andExpect(status().isOk()).andExpect(jsonPath("$.publishedAt").value("2026-01-02T03:04:05Z")).andReturn()
				.getResponse().getContentAsString();
		assertThat(published).contains("\"status\":\"published\"");
		asAdmin(json(put(url), "{\"status\":\"archived\"}")).andExpect(status().isOk())
				.andExpect(jsonPath("$.publishedAt").value("2026-01-02T03:04:05Z"));
		asAdmin(json(put(url), "{\"status\":\"draft\"}")).andExpect(status().isOk()).andExpect(jsonPath("$.status").value("draft"));
	}

	@Test
	void updateReplacesTheTaxonomyAndKeepsTheLanguageGroupAndAuthor() throws Exception {
		String tagOne = newTag("vi");
		String tagTwo = newTag("vi");
		String category = newCategory("vi");
		String id = idOf(asAdmin(json(post(BASE), body("vi", "Edit " + marker(), null, "draft", null, category, "\"" + tagOne + "\"")))
				.andExpect(status().isCreated()));
		String author = jdbc.sql("select author_id::text from cms.post where id = cast(:id as uuid)").param("id", id)
				.query(String.class).single();
		String group = jdbc.sql("select translation_group_id::text from cms.post where id = cast(:id as uuid)").param("id", id)
				.query(String.class).single();

		asAdmin(json(put(BASE + "/" + id), body("vi", "Edited", null, "draft", null, null, "\"" + tagTwo + "\"")))
				.andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Edited"))
				.andExpect(jsonPath("$.categoryId").doesNotExist()).andExpect(jsonPath("$.tagIds.length()").value(1))
				.andExpect(jsonPath("$.tagIds[0]").value(tagTwo)).andExpect(jsonPath("$.authorId").value(author))
				.andExpect(jsonPath("$.translationGroupId").value(group));
		asAdmin(json(put(BASE + "/" + id), body("en", "Edited", null, "draft", null, null, null))).andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/" + id), body("vi", "Edited", null, "draft", null, newCategory("en"), null)))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/" + id), body("vi", "Edited", null, "draft", null, null, "\"" + newTag("en") + "\"")))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/" + id), body("vi", "Edited", null, "draft", null, null, "\"" + UUID.randomUUID() + "\"")))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/" + UUID.randomUUID()), body("vi", "X", null, "draft", null, null, null))).andExpect(status().isNotFound());
	}

	@Test
	void translationsShareAGroupWithOnePostPerLanguageAndTheListFiltersAndPages() throws Exception {
		String m = marker();
		String category = newCategory("vi");
		String vi = idOf(asAdmin(json(post(BASE), body("vi", "Bai " + m, null, "published", "2026-03-01T00:00:00Z", category, null)))
				.andExpect(status().isCreated()));
		String group = jdbc.sql("select translation_group_id::text from cms.post where id = cast(:id as uuid)").param("id", vi)
				.query(String.class).single();
		String translation = body("en", "Post " + m, null, "draft", null, null, null).replace("\"locale\":\"en\"",
				"\"locale\":\"en\",\"translationGroupId\":\"" + group + "\"");

		asAdmin(json(post(BASE), translation)).andExpect(status().isCreated()).andExpect(jsonPath("$.translationGroupId").value(group));
		asAdmin(json(post(BASE), translation.replace("Post", "Again"))).andExpect(status().isConflict());
		asAdmin(json(post(BASE), body("vi", "Gan " + m, null, "published", "2026-04-01T00:00:00Z", category, null)))
				.andExpect(status().isCreated());

		asAdmin(get(BASE + "?q=" + m + "&locale=vi")).andExpect(jsonPath("$.total").value(2))
				.andExpect(jsonPath("$.items[0].title").value("Gan " + m)).andExpect(jsonPath("$.items[1].id").value(vi));
		asAdmin(get(BASE + "?q=" + m + "&status=draft")).andExpect(jsonPath("$.total").value(1));
		asAdmin(get(BASE + "?q=" + m + "&categoryId=" + category)).andExpect(jsonPath("$.total").value(2));
		asAdmin(get(BASE + "?q=" + m + "&locale=vi&size=1&page=1")).andExpect(jsonPath("$.items.length()").value(1))
				.andExpect(jsonPath("$.items[0].id").value(vi)).andExpect(jsonPath("$.total").value(2));
	}

}
