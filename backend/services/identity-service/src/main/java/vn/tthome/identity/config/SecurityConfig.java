package vn.tthome.identity.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import vn.tthome.identity.services.JwtService;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

	private static final String FORBIDDEN_BODY = "{\"code\":\"FORBIDDEN\",\"message\":\"Access denied\"}";

	@Bean
	SecurityFilterChain filterChain(HttpSecurity http, JwtService jwtService) throws Exception {
		http.csrf(AbstractHttpConfigurer::disable)
				.httpBasic(AbstractHttpConfigurer::disable)
				.formLogin(AbstractHttpConfigurer::disable)
				.logout(AbstractHttpConfigurer::disable)
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(a -> a
						.requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
						.requestMatchers("/api/v1/auth/register/**", "/api/v1/auth/login", "/api/v1/auth/login/**",
								"/api/v1/auth/refresh", "/api/v1/auth/logout", "/api/v1/auth/password/forgot",
								"/api/v1/auth/password/reset")
						.permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(e -> e
						.authenticationEntryPoint((request, response, ex) -> JwtAuthenticationFilter.writeUnauthorized(response))
						.accessDeniedHandler((request, response, ex) -> {
							response.setStatus(403);
							response.setContentType(MediaType.APPLICATION_JSON_VALUE);
							response.getWriter().write(FORBIDDEN_BODY);
						}))
				.addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	/** Accounts are authenticated by the services, not by Spring's username/password flow: disables the generated user. */
	@Bean
	UserDetailsService userDetailsService() {
		return username -> {
			throw new UsernameNotFoundException(username);
		};
	}

}
