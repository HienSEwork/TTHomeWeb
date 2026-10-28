package vn.tthome.common.audit;

import java.util.Map;
import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import vn.tthome.common.security.Actor;

/**
 * Records every successful change an admin makes: a POST, PUT, PATCH or DELETE under /api/v1/admin/ that ended with
 * a status below 400. It runs inside the security filters, where the authenticated admin is still known.
 */
public class AuditInterceptor implements HandlerInterceptor {

	static final String ADMIN_BASE = "/api/v1/admin/";
	private static final Set<String> CHANGING = Set.of("POST", "PUT", "PATCH", "DELETE");

	private final AuditSender sender;

	public AuditInterceptor(AuditSender sender) {
		this.sender = sender;
	}

	@Override
	@SuppressWarnings("unchecked")
	public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception failure) {
		if (failure != null || response.getStatus() >= 400 || !CHANGING.contains(request.getMethod())) {
			return;
		}
		String pattern = (String) request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE);
		Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
		String authorization = request.getHeader("Authorization");
		if (pattern == null || !pattern.startsWith(ADMIN_BASE) || authorization == null
				|| authentication == null || !(authentication.getPrincipal() instanceof Actor)) {
			return;
		}
		Map<String, String> variables = (Map<String, String>) request.getAttribute(HandlerMapping.URI_TEMPLATE_VARIABLES_ATTRIBUTE);
		String entityId = variables == null || variables.isEmpty() ? null : variables.values().iterator().next();
		sender.send(authorization, new AuditEvent(request.getMethod() + " " + pattern, entityType(pattern), entityId, clientIp(request)));
	}

	/** The route up to its first variable, without the admin prefix: "cms/posts" for /api/v1/admin/cms/posts/{id}. */
	static String entityType(String pattern) {
		StringBuilder type = new StringBuilder();
		for (String part : pattern.substring(ADMIN_BASE.length()).split("/")) {
			if (part.startsWith("{")) {
				break;
			}
			if (type.length() > 0) {
				type.append('/');
			}
			type.append(part);
		}
		return type.toString();
	}

	/** The gateway sets X-Real-IP from the connection, so it is the client; without a gateway the peer address is. */
	private static String clientIp(HttpServletRequest request) {
		String real = request.getHeader("X-Real-IP");
		return real != null && !real.isBlank() ? real.strip() : request.getRemoteAddr();
	}

}
