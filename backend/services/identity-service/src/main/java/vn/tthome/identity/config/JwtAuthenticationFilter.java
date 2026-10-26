package vn.tthome.identity.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.dtos.AccessClaims;
import vn.tthome.identity.services.jwt.JwtService;

/** Authenticates a request from its Bearer access token; any invalid token ends the request with 401. */
public class JwtAuthenticationFilter extends OncePerRequestFilter {

	static final String UNAUTHORIZED_BODY = "{\"code\":\"TOKEN_INVALID\",\"message\":\"Invalid or expired token\"}";

	private final JwtService jwtService;

	public JwtAuthenticationFilter(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader("Authorization");
		if (header != null && header.startsWith("Bearer ")) {
			try {
				AccessClaims claims = jwtService.parse(header.substring(7));
				List<GrantedAuthority> authorities = claims.roles().stream()
						.<GrantedAuthority>map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList();
				SecurityContextHolder.getContext()
						.setAuthentication(new UsernamePasswordAuthenticationToken(claims, null, authorities));
			} catch (ApiException e) {
				writeUnauthorized(response);
				return;
			}
		}
		chain.doFilter(request, response);
	}

	static void writeUnauthorized(HttpServletResponse response) throws IOException {
		response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
		response.setContentType(MediaType.APPLICATION_JSON_VALUE);
		response.setCharacterEncoding(StandardCharsets.UTF_8.name());
		response.getWriter().write(UNAUTHORIZED_BODY);
	}

}
