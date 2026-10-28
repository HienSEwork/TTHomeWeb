package vn.tthome.search.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;

@Configuration
public class OpenApiConfig {

	@Bean
	OpenAPI searchOpenApi() {
		return new OpenAPI().info(new Info()
				.title("TTHome Cần Thơ - Search API")
				.description("Public read-only room search, map pins, nearby search and suggestions")
				.version("1.0"));
	}

}
