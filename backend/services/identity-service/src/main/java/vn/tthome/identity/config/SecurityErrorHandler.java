package vn.tthome.identity.config;

import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import vn.tthome.common.error.ApiError;

/**
 * Method security (for example a role check on a controller method) throws from inside the controller, where the
 * shared catch-all handler would turn it into a 500. This handler runs first and answers 403 with the shared shape.
 */
@RestControllerAdvice
@Order(Ordered.HIGHEST_PRECEDENCE)
public class SecurityErrorHandler {

	@ExceptionHandler(AccessDeniedException.class)
	ResponseEntity<ApiError> handleDenied(AccessDeniedException e) {
		return ResponseEntity.status(HttpStatus.FORBIDDEN).body(new ApiError("FORBIDDEN", "Access denied"));
	}

}
