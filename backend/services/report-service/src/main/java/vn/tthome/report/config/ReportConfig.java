package vn.tthome.report.config;

import java.time.Clock;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(SourcesProperties.class)
public class ReportConfig {

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
