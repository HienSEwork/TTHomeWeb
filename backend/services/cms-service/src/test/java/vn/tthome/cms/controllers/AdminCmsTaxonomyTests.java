package vn.tthome.cms.controllers;

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

import vn.tthome.cms.CmsIntegrationTestBase;
import vn.tthome.cms.support.TestTokens;

/** Categories, tags and static pages against a real PostgreSQL: constraints, references and sanitizing. */
@AutoConfigureMockMvc
class AdminCmsTaxonomyTests extends CmsIntegrationTestBase {

	private static final String BASE = "/api/v1/admin/cms";

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

	private static String category(String locale, String parent, String slug) {
		return "{\"locale\":\"" + locale + "\",\"parentId\":" + (parent == null ? "null" : "\"" + parent + "\"") + ",\"name\":\" N "
				+ slug + " \",\"slug\":\"" + slug + "\",\"sortOrder\":1}";
	}

	@Test
	void categoriesFormATreeWithUniqueSlugsPerLanguage() throws Exception {
		String slug = "c-" + marker();
		String top = idOf(asAdmin(json(post(BASE + "/categories"), category("vi", null, slug))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.name").value("N " + slug)));
		String child = idOf(asAdmin(json(post(BASE + "/categories"), category("vi", top, slug + "-child")))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.parentId").value(top)));

		asAdmin(json(post(BASE + "/categories"), category("vi", null, slug))).andExpect(status().isConflict());
		asAdmin(json(post(BASE + "/categories"), category("en", null, slug))).andExpect(status().isCreated());
		asAdmin(json(post(BASE + "/categories"), category("en", top, slug + "-x"))).andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/categories/" + top), category("vi", child, slug))).andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/categories/" + child), category("vi", top, slug + "-child"))).andExpect(status().isOk());
		asAdmin(get(BASE + "/categories?locale=vi")).andExpect(status().isOk());
	}

	@Test
	void aCategoryWithChildrenOrPostsCannotBeDeleted() throws Exception {
		String slug = "c-" + marker();
		String top = idOf(asAdmin(json(post(BASE + "/categories"), category("vi", null, slug))));
		String child = idOf(asAdmin(json(post(BASE + "/categories"), category("vi", top, slug + "-child"))));

		asAdmin(delete(BASE + "/categories/" + top)).andExpect(status().isConflict());

		jdbc.sql("insert into cms.post (category_id, title, slug, content) values (cast(:c as uuid), 'T', :slug, 'x')")
				.param("c", child).param("slug", "p-" + marker()).update();
		asAdmin(delete(BASE + "/categories/" + child)).andExpect(status().isConflict());

		jdbc.sql("delete from cms.post where category_id = cast(:c as uuid)").param("c", child).update();
		asAdmin(delete(BASE + "/categories/" + child)).andExpect(status().isNoContent());
		asAdmin(delete(BASE + "/categories/" + top)).andExpect(status().isNoContent());
	}

	@Test
	void tagsAreUniquePerLanguageAndKeptWhilePostsUseThem() throws Exception {
		String slug = "t-" + marker();
		String body = "{\"locale\":\"vi\",\"name\":\" Pets \",\"slug\":\"" + slug + "\"}";
		String id = idOf(asAdmin(json(post(BASE + "/tags"), body)).andExpect(status().isCreated()).andExpect(jsonPath("$.name").value("Pets")));

		asAdmin(json(post(BASE + "/tags"), body)).andExpect(status().isConflict());
		asAdmin(json(put(BASE + "/tags/" + id), body.replace("Pets", "Cats"))).andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value("Cats"));

		UUID post = UUID.randomUUID();
		jdbc.sql("insert into cms.post (id, title, slug, content) values (:id, 'T', :slug, 'x')").param("id", post)
				.param("slug", "p-" + marker()).update();
		jdbc.sql("insert into cms.post_tag (post_id, tag_id) values (:p, cast(:t as uuid))").param("p", post).param("t", id).update();
		asAdmin(delete(BASE + "/tags/" + id)).andExpect(status().isConflict());

		jdbc.sql("delete from cms.post_tag where post_id = :p").param("p", post).update();
		asAdmin(delete(BASE + "/tags/" + id)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/tags?locale=vi")).andExpect(status().isOk());
	}

	private static String page(String locale, String group, String slug, String content, String status) {
		return "{\"locale\":\"" + locale + "\",\"translationGroupId\":" + (group == null ? "null" : "\"" + group + "\"")
				+ ",\"slug\":\"" + slug + "\",\"title\":\" About \",\"content\":\"" + content + "\",\"status\":\"" + status + "\"}";
	}

	@Test
	void aPageStoresSanitizedContentAndKeepsNestedSlugs() throws Exception {
		String slug = "chinh-sach/" + marker();

		String id = idOf(asAdmin(json(post(BASE + "/pages"),
				page("vi", null, slug, "<p onclick=\\\"x()\\\">Hi</p><script>alert(1)</script><b>bold</b>", "published")))
				.andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("About"))
				.andExpect(jsonPath("$.slug").value(slug)));

		asAdmin(get(BASE + "/pages/" + id)).andExpect(status().isOk()).andExpect(jsonPath("$.content").value("<p>Hi</p><b>bold</b>"));
		assertThat(jdbc.sql("select content from cms.page where id = cast(:id as uuid)").param("id", id).query(String.class).single())
				.doesNotContain("script", "onclick");
	}

	@Test
	void translationsShareAGroupAndEachLanguageHasOnePage() throws Exception {
		String m = marker();
		String vi = idOf(asAdmin(json(post(BASE + "/pages"), page("vi", null, "ve-" + m, "x", "published")))
				.andExpect(status().isCreated()));
		String group = jdbc.sql("select translation_group_id::text from cms.page where id = cast(:id as uuid)").param("id", vi)
				.query(String.class).single();

		asAdmin(json(post(BASE + "/pages"), page("en", group, "about-" + m, "x", "draft"))).andExpect(status().isCreated())
				.andExpect(jsonPath("$.translationGroupId").value(group)).andExpect(jsonPath("$.status").value("draft"));
		asAdmin(json(post(BASE + "/pages"), page("en", group, "about-2-" + m, "x", "draft"))).andExpect(status().isConflict());
		asAdmin(json(post(BASE + "/pages"), page("vi", null, "ve-" + m, "x", "draft"))).andExpect(status().isConflict());

		asAdmin(json(put(BASE + "/pages/" + vi), page("en", null, "ve-" + m, "x", "published"))).andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/pages/" + vi), page("vi", UUID.randomUUID().toString(), "ve-" + m, "x", "published")))
				.andExpect(status().isBadRequest());
		asAdmin(json(put(BASE + "/pages/" + vi), page("vi", null, "ve-moi-" + m, "y", "draft"))).andExpect(status().isOk())
				.andExpect(jsonPath("$.slug").value("ve-moi-" + m)).andExpect(jsonPath("$.status").value("draft"));

		asAdmin(get(BASE + "/pages?locale=en&status=draft")).andExpect(status().isOk());
		asAdmin(delete(BASE + "/pages/" + vi)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/pages/" + vi)).andExpect(status().isNotFound());
	}

}
