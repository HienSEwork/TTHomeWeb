package vn.tthome.common.security;

import java.io.IOException;
import java.util.List;

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

/** Authenticates a request from its Bearer access token; a missing or invalid token only means "not authenticated". */
public class BearerTokenFilter extends OncePerRequestFilter {

	private final AccessTokenParser parser;

	public BearerTokenFilter(AccessTokenParser parser) {
		this.parser = parser;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader("Authorization");
		if (header != null && header.startsWith("Bearer ")) {
			try {
				AccessClaims claims = parser.parse(header.substring(7));
				List<GrantedAuthority> authorities = claims.roles().stream()
						.<GrantedAuthority>map(role -> new SimpleGrantedAuthority("ROLE_" + role)).toList();
				SecurityContextHolder.getContext()
						.setAuthentication(new UsernamePasswordAuthenticationToken(claims, null, authorities));
			} catch (ApiException e) {
				SecurityContextHolder.clearContext();
			}
		}
		chain.doFilter(request, response);
	}

}
