package vn.tthome.media.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

import vn.tthome.common.error.ApiException;
import vn.tthome.common.error.GlobalExceptionHandler;
import vn.tthome.common.security.ResourceServerAutoConfiguration;
import vn.tthome.common.web.PageResponse;
import vn.tthome.media.models.dtos.AssetRequest;
import vn.tthome.media.models.dtos.AssetResponse;
import vn.tthome.media.models.dtos.UploadSignatureRequest;
import vn.tthome.media.models.dtos.UploadSignatureResponse;
import vn.tthome.media.services.asset.AssetService;
import vn.tthome.media.services.uploadsigner.UploadSigner;
import vn.tthome.media.support.TestTokens;

/** Routing, validation, authorization and error mapping of the media endpoints, with the services mocked. */
@WebMvcTest(MediaController.class)
@ImportAutoConfiguration(ResourceServerAutoConfiguration.class)
@Import(GlobalExceptionHandler.class)
@TestPropertySource(properties = "tthome.security.jwt-secret=" + TestTokens.SECRET)
class MediaControllerWebTest {

	private static final String BASE = "/api/v1/admin/media";
	private static final UUID ID = UUID.randomUUID();
	private static final String SIGN = "{\"folder\":\"tthome/projects\",\"resourceType\":\"image\"}";
	private static final String ASSET = "{\"publicId\":\"a/b\",\"resourceType\":\"image\","
			+ "\"secureUrl\":\"https://res.cloudinary.com/demo/image/upload/a/b.jpg\"}";

	@Autowired
	MockMvc mvc;
	@MockitoBean
	UploadSigner signer;
	@MockitoBean
	AssetService assets;

	private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
		return mvc.perform(request.header("Authorization", TestTokens.admin()));
	}

	private static MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder request, String body) {
		return request.contentType(MediaType.APPLICATION_JSON).content(body);
	}

	private static AssetResponse asset() {
		return new AssetResponse(ID, "a/b", "image", "jpg", null, null, null, null, null,
				"https://res.cloudinary.com/demo/image/upload/a/b.jpg", null, null, null);
	}

	@Test
	void everyEndpointNeedsAnAdminToken() throws Exception {
		List<MockHttpServletRequestBuilder> all = List.of(json(post(BASE + "/upload-signature"), SIGN),
				json(post(BASE + "/assets"), ASSET), get(BASE + "/assets"), get(BASE + "/assets/" + ID),
				delete(BASE + "/assets/" + ID));
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request).andExpect(status().isUnauthorized());
		}
		for (MockHttpServletRequestBuilder request : all) {
			mvc.perform(request.header("Authorization", TestTokens.bearer("LANDLORD"))).andExpect(status().isForbidden());
		}
		verifyNoInteractions(signer, assets);
	}

	@Test
	void uploadSignatureIsReturnedAndItsRequestValidated() throws Exception {
		when(signer.sign(any(UploadSignatureRequest.class)))
				.thenReturn(new UploadSignatureResponse("https://api.cloudinary.com/v1_1/demo/image/upload", "demo", "key", 1L,
						"tthome/projects", "sig"));

		asAdmin(json(post(BASE + "/upload-signature"), SIGN)).andExpect(status().isOk())
				.andExpect(jsonPath("$.signature").value("sig")).andExpect(jsonPath("$.apiSecret").doesNotExist());

		for (String body : List.of("{}", SIGN.replace("image", "raw"), SIGN.replace("tthome/projects", "../etc"),
				SIGN.replace("tthome/projects", "a b"), SIGN.replace("tthome/projects", "a/"),
				SIGN.replace("tthome/projects", "x".repeat(201)))) {
			asAdmin(json(post(BASE + "/upload-signature"), body)).andExpect(status().isBadRequest())
					.andExpect(jsonPath("$.code").value("VALIDATION_ERROR"));
		}
	}

	@Test
	void registeringAnAssetAnswers201AndValidatesTheBody() throws Exception {
		when(assets.register(any(UUID.class), any(AssetRequest.class))).thenReturn(asset());

		asAdmin(json(post(BASE + "/assets"), ASSET)).andExpect(status().isCreated())
				.andExpect(jsonPath("$.publicId").value("a/b"));

		for (String body : List.of("{}", ASSET.replace("a/b\"", "\""), ASSET.replace("image", "gif"),
				ASSET.replace("}", ",\"bytes\":-1}"), ASSET.replace("}", ",\"durationSec\":-1}"),
				ASSET.replace("}", ",\"width\":-1}"))) {
			asAdmin(json(post(BASE + "/assets"), body)).andExpect(status().isBadRequest());
		}
	}

	@Test
	void listGetAndDeleteDelegateAndMapErrors() throws Exception {
		when(assets.list(null, null, null, 0, 50)).thenReturn(new PageResponse<>(List.of(asset()), 0, 50, 1));
		UUID missing = UUID.randomUUID();
		when(assets.get(missing)).thenThrow(new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "nope"));

		asAdmin(get(BASE + "/assets")).andExpect(status().isOk()).andExpect(jsonPath("$.items[0].id").value(ID.toString()));
		asAdmin(get(BASE + "/assets/" + missing)).andExpect(status().isNotFound());
		asAdmin(delete(BASE + "/assets/" + ID)).andExpect(status().isNoContent());
		for (String query : List.of("page=-1", "size=0", "size=201", "folder=" + "x".repeat(201))) {
			asAdmin(get(BASE + "/assets?" + query)).andExpect(status().isBadRequest());
		}
	}

}
