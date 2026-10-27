package vn.tthome.identity.config;

import java.time.Clock;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties({ AuthProperties.class, BootstrapProperties.class })
public class AuthConfig {

	@Bean
	Clock clock() {
		return Clock.systemUTC();
	}

}
