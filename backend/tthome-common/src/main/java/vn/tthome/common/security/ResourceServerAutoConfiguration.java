package vn.tthome.common.security;

import java.io.IOException;
import java.time.Clock;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import jakarta.servlet.http.HttpServletResponse;
import vn.tthome.common.error.ApiError;

/**
 * Makes a service a resource server: every request except health and the API docs needs a valid access token, and
 * methods can be restricted with @PreAuthorize("hasRole('ADMIN')"). Enabled by setting tthome.security.jwt-secret.
 */
// Before Spring Boot's own filter chain and user store, whose @ConditionalOnMissingBean would otherwise win.
@AutoConfiguration(beforeName = {
		"org.springframework.boot.security.autoconfigure.web.servlet.ServletWebSecurityAutoConfiguration",
		"org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration" })
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnProperty("tthome.security.jwt-secret")
@EnableWebSecurity
@EnableMethodSecurity
public class ResourceServerAutoConfiguration {

	private static final String UNAUTHORIZED_BODY = "{\"code\":\"TOKEN_INVALID\",\"message\":\"Invalid or expired token\"}";
	private static final String FORBIDDEN_BODY = "{\"code\":\"FORBIDDEN\",\"message\":\"Access denied\"}";

	@Bean
	@ConditionalOnMissingBean
	AccessTokenParser accessTokenParser(@Value("${tthome.security.jwt-secret}") String secret) {
		return new AccessTokenParser(secret, Clock.systemUTC());
	}

	@Bean
	@ConditionalOnMissingBean(SecurityFilterChain.class)
	SecurityFilterChain resourceServerFilterChain(HttpSecurity http, AccessTokenParser parser) throws Exception {
		http.csrf(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(a -> a
						.requestMatchers("/actuator/health", "/actuator/health/**", "/v3/api-docs/**",
								"/swagger-ui.html", "/swagger-ui/**")
						.permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(e -> e
						.authenticationEntryPoint((request, response, ex) -> write(response, 401, UNAUTHORIZED_BODY))
						.accessDeniedHandler((request, response, ex) -> write(response, 403, FORBIDDEN_BODY)))
				.addFilterBefore(new BearerTokenFilter(parser), UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	/** Tokens come from identity-service, so Spring's generated user must not exist. */
	@Bean
	@ConditionalOnMissingBean
	UserDetailsService noUserDetailsService() {
		return username -> {
			throw new UsernameNotFoundException(username);
		};
	}

	/** Method security throws from inside the controller, where the catch-all handler would answer 500. */
	@Bean
	@ConditionalOnMissingBean
	AccessDeniedAdvice accessDeniedAdvice() {
		return new AccessDeniedAdvice();
	}

	@RestControllerAdvice
	@Order(Ordered.HIGHEST_PRECEDENCE)
	static class AccessDeniedAdvice {

		@ExceptionHandler(AccessDeniedException.class)
		ResponseEntity<ApiError> handleDenied(AccessDeniedException e) {
			return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("FORBIDDEN", "Access denied"));
		}

	}

	private static void write(HttpServletResponse response, int status, String body) throws IOException {
		response.setStatus(status);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.getWriter().write(body);
	}

}
