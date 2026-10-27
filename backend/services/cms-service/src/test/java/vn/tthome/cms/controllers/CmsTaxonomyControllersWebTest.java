package vn.tthome.cms.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.cms.models.dtos.CategoryResponse;
import vn.tthome.cms.models.dtos.StaticPageResponse;
import vn.tthome.cms.models.dtos.TagResponse;
import vn.tthome.cms.services.category.CategoryService;
import vn.tthome.cms.services.staticpage.StaticPageService;
import vn.tthome.cms.services.tag.TagService;
import vn.tthome.cms.support.TestTokens;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;

/** Routing, validation and authorization of the category, tag and static page endpoints. */
@WebMvcTest({ CategoryController.class, TagController.class, StaticPageController.class })
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class CmsTaxonomyControllersWebTest {

	private static final String BASE = "/api/v1/admin/cms";
	private static final UUID ID = UUID.randomUUID();
	private static final String CATEGORY = "{\"locale\":\"vi\",\"name\":\"News\",\"slug\":\"news\",\"sortOrder\":1}";
	private static final String TAG = "{\"locale\":\"vi\",\"name\":\"Pets\",\"slug\":\"pets\"}";
	private static final String PAGE = "{\"locale\":\"vi\",\"slug\":\"chinh-sach/bao-mat\",\"title\":\"Privacy\","
			+ "\"content\":\"<p>x</p>\",\"status\":\"published\"}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	CategoryService categories;
	@MockitoBean
	TagService tags;
	@MockitoBean
	StaticPageService pages;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		List<MockHttpServletRequestBuilder> all = List.of(get(BASE + "/categories"), json(post(BASE + "/categories"), CATEGORY),
				json(put(BASE + "/categories/" + ID), CATEGORY), delete(BASE + "/categories/" + ID), get(BASE + "/tags"),
				json(post(BASE + "/tags"), TAG), delete(BASE + "/tags/" + ID), get(BASE + "/pages"),
				get(BASE + "/pages/" + ID), json(post(BASE + "/pages"), PAGE), json(put(BASE + "/pages/" + ID), PAGE),
				delete(BASE + "/pages/" + ID));
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("AGENT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(categories, tags, pages);
	}

	@Test
	void validBodiesAreAccepted() throws Exception {
		when(categories.create(any())).thenReturn(new CategoryResponse(ID, "vi", null, "News", "news", (short) 1));
		when(tags.create(any())).thenReturn(new TagResponse(ID, "vi", "Pets", "pets"));
		when(pages.create(any())).thenReturn(
				new StaticPageResponse(ID, UUID.randomUUID(), "vi", "chinh-sach/bao-mat", "Privacy", "<p>x</p>", "published"));

		asAdmin(json(post(BASE + "/categories"), CATEGORY)).andExpect(status().isCreated()).andExpect(jsonPath("$.slug").value("news"));
		asAdmin(json(post(BASE + "/tags"), TAG)).andExpect(status().isCreated());
		asAdmin(json(post(BASE + "/pages"), PAGE)).andExpect(status().isCreated())
				.andExpect(jsonPath("$.slug").value("chinh-sach/bao-mat"));
	}

	@Test
	void invalidCategoriesAndTagsAreRejected() throws Exception {
		for (String body : List.of("{}", CATEGORY.replace("news", "News Item"), CATEGORY.replace("news", "-news"),
				CATEGORY.replace("vi", "de"), CATEGORY.replace("\"sortOrder\":1", "\"sortOrder\":-1"), CATEGORY.replace("News", " "),
				CATEGORY.replace("}", ",\"parentId\":\"nope\"}"))) {
			asAdmin(json(post(BASE + "/categories"), body)).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		for (String body : List.of("{}", TAG.replace("pets", "pets/x"), TAG.replace("Pets", "x".repeat(101)))) {
			asAdmin(json(post(BASE + "/tags"), body)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(categories, tags);
	}

	@Test
	void invalidPagesAreRejected() throws Exception {
		for (String body : List.of("{}", PAGE.replace("chinh-sach/bao-mat", "/leading"), PAGE.replace("chinh-sach/bao-mat", "a//b"),
				PAGE.replace("chinh-sach/bao-mat", "Upper"), PAGE.replace("chinh-sach/bao-mat", "a/"), PAGE.replace("published", "archived"),
				PAGE.replace("Privacy", ""), PAGE.replace("}", ",\"translationGroupId\":\"nope\"}"),
				PAGE.replace("<p>x</p>", "x".repeat(200_001)))) {
			asAdmin(json(post(BASE + "/pages"), body)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(pages);
	}

}
