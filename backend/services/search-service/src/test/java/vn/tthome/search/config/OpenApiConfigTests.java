package vn.tthome.search.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springdoc.core.configuration.SpringDocConfiguration;
import org.springdoc.core.properties.SpringDocConfigProperties;
import org.springdoc.core.properties.SwaggerUiConfigProperties;
import org.springdoc.core.properties.SwaggerUiOAuthProperties;
import org.springdoc.webmvc.core.configuration.MultipleOpenApiSupportConfiguration;
import org.springdoc.webmvc.core.configuration.SpringDocWebMvcConfiguration;
import org.springdoc.webmvc.ui.SwaggerConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import vn.tthome.search.controllers.MapController;
import vn.tthome.search.controllers.SearchController;
import vn.tthome.search.services.map.MapService;
import vn.tthome.search.services.search.SearchService;

@WebMvcTest({ SearchController.class, MapController.class })
@ImportAutoConfiguration({ SpringDocConfiguration.class, SpringDocConfigProperties.class,
		SpringDocWebMvcConfiguration.class, MultipleOpenApiSupportConfiguration.class, SwaggerConfig.class,
		SwaggerUiConfigProperties.class, SwaggerUiOAuthProperties.class })
@Import(OpenApiConfig.class)
class OpenApiConfigTests {

	@Autowired
	MockMvc mvc;

	@MockitoBean
	SearchService search;

	@MockitoBean
	MapService map;

	@Test
	void exposesApiDocsWithSearchTitleAndEndpoint() throws Exception {
		mvc.perform(get("/v3/api-docs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.info.title").value("TTHome Cần Thơ - Search API"))
				.andExpect(jsonPath("$.info.version").value("1.0"))
				.andExpect(jsonPath("$.paths['/api/v1/search']").exists())
				.andExpect(jsonPath("$.paths['/api/v1/map']").exists());
	}

}
