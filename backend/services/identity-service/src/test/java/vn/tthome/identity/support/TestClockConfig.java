package vn.tthome.identity.support;

import java.time.Instant;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

/** Integration tests share one controllable clock; picked up by component scan on the test classpath only. */
@Configuration(proxyBeanMethods = false)
public class TestClockConfig {

	@Bean
	@Primary
	MutableClock testClock() {
		return new MutableClock(Instant.now());
	}

}
