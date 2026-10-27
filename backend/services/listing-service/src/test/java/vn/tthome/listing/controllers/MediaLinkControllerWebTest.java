package vn.tthome.listing.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
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

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.listing.models.dtos.MediaLinkResponse;
import vn.tthome.listing.models.dtos.SetMediaRequest;
import vn.tthome.listing.services.medialink.MediaLinkService;
import vn.tthome.listing.support.TestTokens;

/** Routing, validation and authorization of the gallery endpoints, with the service mocked. */
@WebMvcTest(MediaLinkController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class MediaLinkControllerWebTest {

	private static final UUID ID = UUID.randomUUID();
	private static final UUID ASSET = UUID.randomUUID();
	private static final String BODY = "{\"items\":[{\"assetId\":\"" + ASSET + "\",\"kind\":\"photo\",\"cover\":true}]}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	MediaLinkService media;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		List<MockHttpServletRequestBuilder> all = List.of(get("/api/v1/admin/projects/" + ID + "/media"),
				json(put("/api/v1/admin/projects/" + ID + "/media"), BODY), get("/api/v1/admin/rooms/" + ID + "/media"),
				json(put("/api/v1/admin/rooms/" + ID + "/media"), BODY));
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("AGENT"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(media);
	}

	@Test
	void galleriesAreReadAndReplacedForProjectsAndRooms() throws Exception {
		MediaLinkResponse link = new MediaLinkResponse(ASSET, "photo", (short) 0, true);
		when(media.ofProject(ID)).thenReturn(List.of(link));
		when(media.replaceForProject(eq(ID), any(SetMediaRequest.class))).thenReturn(List.of(link));
		when(media.ofRoom(ID)).thenReturn(List.of());
		when(media.replaceForRoom(eq(ID), any(SetMediaRequest.class))).thenReturn(List.of(link));

		asAdmin(get("/api/v1/admin/projects/" + ID + "/media")).andExpect(status().isOk())
				.andExpect(jsonPath("$[0].assetId").value(ASSET.toString())).andExpect(jsonPath("$[0].cover").value(true));
		asAdmin(json(put("/api/v1/admin/projects/" + ID + "/media"), BODY)).andExpect(status().isOk());
		asAdmin(get("/api/v1/admin/rooms/" + ID + "/media")).andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
		asAdmin(json(put("/api/v1/admin/rooms/" + ID + "/media"), BODY)).andExpect(status().isOk());
		verify(media).replaceForRoom(ID, new SetMediaRequest(
				List.of(new vn.tthome.listing.models.dtos.MediaLinkItem(ASSET, "photo", true))));
	}

	@Test
	void invalidGalleriesAreRejected() throws Exception {
		List<String> tooMany = new ArrayList<>();
		for (int i = 0; i < 101; i++) {
			tooMany.add("{\"assetId\":\"" + UUID.randomUUID() + "\",\"kind\":\"photo\"}");
		}
		for (String body : List.of("{}", "{\"items\":null}", "{\"items\":[null]}", "{\"items\":[{\"kind\":\"photo\"}]}",
				"{\"items\":[{\"assetId\":\"" + ASSET + "\"}]}", "{\"items\":[{\"assetId\":\"" + ASSET + "\",\"kind\":\"gif\"}]}",
				"{\"items\":[{\"assetId\":\"nope\",\"kind\":\"photo\"}]}", "{\"items\":[" + String.join(",", tooMany) + "]}")) {
			asAdmin(json(put("/api/v1/admin/rooms/" + ID + "/media"), body)).andExpect(status().isBadRequest());
		}
		verifyNoInteractions(media);
	}

	@Test
	void serviceErrorsKeepTheirStatus() throws Exception {
		when(media.ofRoom(ID)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Room not found"));

		asAdmin(get("/api/v1/admin/rooms/" + ID + "/media")).andExpect(status().isNotFound())
				.andExpect(jsonPath("$.code").value("NOT_FOUND"));
		asAdmin(get("/api/v1/admin/rooms/not-a-uuid/media")).andExpect(status().isBadRequest());
	}

}
