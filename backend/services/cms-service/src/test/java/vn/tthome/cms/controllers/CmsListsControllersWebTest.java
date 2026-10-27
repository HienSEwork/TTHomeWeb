package vn.tthome.cms.controllers;

import static org.mockito.Mockito.doThrow;
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
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import vn.tthome.cms.models.dtos.BannerResponse;
import vn.tthome.cms.models.dtos.FaqResponse;
import vn.tthome.cms.models.dtos.MenuItemResponse;
import vn.tthome.cms.services.banner.BannerService;
import vn.tthome.cms.services.faq.FaqService;
import vn.tthome.cms.services.menuitem.MenuItemService;
import vn.tthome.cms.support.TestTokens;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;

/** Routing, validation, authorization and error mapping of the banner, FAQ and menu endpoints. */
@WebMvcTest({ BannerController.class, FaqController.class, MenuItemController.class })
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class CmsListsControllersWebTest {

	private static final String BASE = "/api/v1/admin/cms";
	private static final UUID ID = UUID.randomUUID();
	private static final String BANNER = "{\"locale\":\"vi\",\"placement\":\"home_hero\",\"imageUrl\":\"https://res.cloudinary.com/d/a.jpg\","
			+ "\"sortOrder\":1,\"active\":true}";
	private static final String FAQ = "{\"locale\":\"vi\",\"audience\":\"all\",\"question\":\"Q?\",\"answer\":\"A\",\"sortOrder\":1}";
	private static final String MENU = "{\"locale\":\"vi\",\"location\":\"header\",\"label\":\"Rooms\",\"url\":\"/rooms\",\"sortOrder\":1}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	BannerService banners;
	@MockitoBean
	FaqService faqs;
	@MockitoBean
	MenuItemService menus;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static List<MockHttpServletRequestBuilder> everyEndpoint() {
		return List.of(get(BASE + "/banners"), get(BASE + "/banners/" + ID), json(post(BASE + "/banners"), BANNER),
				json(put(BASE + "/banners/" + ID), BANNER), delete(BASE + "/banners/" + ID), get(BASE + "/faqs"),
				json(post(BASE + "/faqs"), FAQ), json(put(BASE + "/faqs/" + ID), FAQ), delete(BASE + "/faqs/" + ID),
				get(BASE + "/menu-items"), json(post(BASE + "/menu-items"), MENU),
				json(put(BASE + "/menu-items/" + ID), MENU), delete(BASE + "/menu-items/" + ID));
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : everyEndpoint()) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("CONSULTANT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(banners, faqs, menus);
	}

	@Test
	void listsPassTheirFiltersAndReturnTheItems() throws Exception {
		when(banners.list("vi", "home_hero", true)).thenReturn(List.of(new BannerResponse(ID, "vi", "home_hero", null,
				"https://res.cloudinary.com/d/a.jpg", null, null, (short) 1, null, null, true)));
		when(faqs.list(null, null, null)).thenReturn(List.of());
		when(menus.list("vi", "header")).thenReturn(List.of(new MenuItemResponse(ID, "vi", "header", null, "Rooms", "/rooms",
				false, (short) 1, true)));

		asAdmin(get(BASE + "/banners?locale=vi&placement=home_hero&active=true")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].placement").value("home_hero")).andExpect(jsonPath("$[0].active").value(true));
		asAdmin(get(BASE + "/faqs")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
		asAdmin(get(BASE + "/menu-items?locale=vi&location=header")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].label").value("Rooms"));
		asAdmin(get(BASE + "/banners?active=maybe")).andExpect(status().isBadRequest());
	}

	@Test
	void validBodiesAreAcceptedAndCreateAnswers201() throws Exception {
		when(banners.create(org.mockito.ArgumentMatchers.any())).thenReturn(new BannerResponse(ID, "vi", "home_hero", null,
				"https://res.cloudinary.com/d/a.jpg", null, null, (short) 1, null, null, true));
		when(faqs.create(org.mockito.ArgumentMatchers.any()))
				.thenReturn(new FaqResponse(ID, "vi", "all", "Q?", "A", (short) 1, true));
		when(menus.create(org.mockito.ArgumentMatchers.any())).thenReturn(new MenuItemResponse(ID, "vi", "header", null,
				"Rooms", "/rooms", false, (short) 1, true));

		asAdmin(json(post(BASE + "/banners"), BANNER)).andExpect(status().isCreated());
		asAdmin(json(post(BASE + "/faqs"), FAQ)).andExpect(status().isCreated());
		asAdmin(json(post(BASE + "/menu-items"), MENU)).andExpect(status().isCreated());
	}

	@Test
	void invalidBannersAreRejected() throws Exception {
		for (String body : List.of("{}", BANNER.replace("vi", "fr"), BANNER.replace("home_hero", "Home Hero"),
				BANNER.replace("https://res.cloudinary.com/d/a.jpg", "http://insecure/a.jpg"),
				BANNER.replace("https://res.cloudinary.com/d/a.jpg", "javascript:alert(1)"),
				BANNER.replace("\"sortOrder\":1", "\"sortOrder\":-1"), BANNER.replace("}", ",\"linkUrl\":\"javascript:x\"}"),
				BANNER.replace("}", ",\"title\":\"" + "x".repeat(201) + "\"}"), BANNER.replace("}", ",\"startsAt\":\"soon\"}"))) {
			asAdmin(json(post(BASE + "/banners"), body)).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
		verifyNoInteractions(banners);
	}

	@Test
	void invalidFaqsAndMenuItemsAreRejected() throws Exception {
		for (String body : List.of("{}", FAQ.replace("all", "everyone"), FAQ.replace("Q?", " "), FAQ.replace("\"A\"", "\"\""))) {
			asAdmin(json(post(BASE + "/faqs"), body)).andExpect(status().isBadRequest());
		}
		for (String body : List.of("{}", MENU.replace("header", "sidebar"), MENU.replace("/rooms", "rooms"),
				MENU.replace("/rooms", "http://x.example"), MENU.replace("Rooms", " "), MENU.replace("}", ",\"parentId\":\"nope\"}"))) {
			asAdmin(json(post(BASE + "/menu-items"), body)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(faqs, menus);
	}

	@Test
	void serviceErrorsKeepTheirStatus() throws Exception {
		when(banners.get(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));
		doThrow(new ApiException(HttpStatus.CONFLICT, "CONFLICT", "children")).when(menus).delete(ID);

		asAdmin(get(BASE + "/banners/" + ID)).andExpect(status().isNotFound());
		asAdmin(delete(BASE + "/menu-items/" + ID)).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("CONFLICT"));
		asAdmin(delete(BASE + "/faqs/" + ID)).andExpect(status().isNoContent());
		asAdmin(get(BASE + "/banners/not-a-uuid")).andExpect(status().isBadRequest());
	}

}
