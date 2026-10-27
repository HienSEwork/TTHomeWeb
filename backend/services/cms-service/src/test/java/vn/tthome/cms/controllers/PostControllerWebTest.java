package vn.tthome.cms.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
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

import vn.tthome.cms.models.dtos.PostResponse;
import vn.tthome.cms.services.post.PostService;
import vn.tthome.cms.support.TestTokens;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;

/** Routing, validation and authorization of the post endpoints, with the service mocked. */
@WebMvcTest(PostController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class PostControllerWebTest {

	private static final String BASE = "/api/v1/admin/cms/posts";
	private static final UUID ID = UUID.randomUUID();
	private static final String BODY = "{\"locale\":\"vi\",\"title\":\"Hello\",\"content\":\"<p>x</p>\",\"status\":\"draft\",\"tagIds\":[]}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	PostService posts;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static PostResponse sample() {
		return new PostResponse(ID, UUID.randomUUID(), "vi", null, null, null, "Hello", "hello", null, "<p>x</p>", null,
				(short) 1, 0, "draft", null, List.of());
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		List<MockHttpServletRequestBuilder> all = List.of(get(BASE), get(BASE + "/" + ID), json(post(BASE), BODY),
				json(put(BASE + "/" + ID), BODY), json(put(BASE + "/" + ID + "/status"), "{\"status\":\"published\"}"),
				delete(BASE + "/" + ID));
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(posts);
	}

	@Test
	void listUsesDefaultsAndPassesFilters() throws Exception {
		UUID category = UUID.randomUUID();
		when(posts.list(null, null, null, null, 0, 20)).thenReturn(new PageResponse<>(List.of(sample()), 0, 20, 1));
		when(posts.list("vi", "published", category, "nha", 2, 10)).thenReturn(new PageResponse<>(List.of(), 2, 10, 0));

		asAdmin(get(BASE)).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].slug").value("hello"));
		asAdmin(get(BASE + "?locale=vi&status=published&categoryId=" + category + "&q=nha&page=2&size=10")).andExpect(status().isOk());
		for (String query : List.of("page=-1", "size=0", "size=101", "categoryId=abc", "q=" + "x".repeat(101))) {
			asAdmin(get(BASE + "?" + query)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void createPassesTheCallerAsTheAuthor() throws Exception {
		when(posts.create(any(UUID.class), any())).thenReturn(sample());

		asAdmin(json(post(BASE), BODY)).andExpect(status().isCreated()).andExpect(jsonPath("$.title").value("Hello"));

		verify(posts).create(any(UUID.class), any());
	}

	@Test
	void invalidPostsAreRejected() throws Exception {
		for (String body : List.of("{}", BODY.replace("Hello", " "), BODY.replace("vi", "fr"), BODY.replace("draft", "deleted"),
				BODY.replace("\"tagIds\":[]", "\"tagIds\":null"), BODY.replace("\"tagIds\":[]", "\"tagIds\":[null]"),
				BODY.replace("}", ",\"slug\":\"Not A Slug\"}"), BODY.replace("}", ",\"coverUrl\":\"http://x/a.jpg\"}"),
				BODY.replace("}", ",\"publishedAt\":\"yesterday\"}"), BODY.replace("}", ",\"categoryId\":\"nope\"}"),
				BODY.replace("<p>x</p>", ""), BODY.replace("Hello", "x".repeat(301)))) {
			asAdmin(json(post(BASE), body)).andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		verifyNoInteractions(posts);
	}

	@Test
	void statusUpdateDelegatesAndValidates() throws Exception {
		when(posts.setStatus(eq(ID), eq("published"), any())).thenReturn(sample());

		asAdmin(json(put(BASE + "/" + ID + "/status"), "{\"status\":\"published\"}")).andExpect(status().isOk());
		for (String body : List.of("{}", "{\"status\":\"deleted\"}", "{\"status\":\"scheduled\",\"publishedAt\":\"later\"}")) {
			asAdmin(json(put(BASE + "/" + ID + "/status"), body)).andExpect(status().isBadRequest());
		}
		asAdmin(delete(BASE + "/" + ID)).andExpect(status().isNoContent());
		verify(posts).delete(ID);
	}

}
