package vn.tthome.common.audit;

import org.springframework.boot.autoconfigure.AutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Writes every admin change to the audit log of report-service. Enabled by setting tthome.audit.url (left empty it
 * stays off, which is what the tests of the services do).
 */
@AutoConfiguration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
@ConditionalOnClass(SecurityContextHolder.class)
@ConditionalOnExpression("!'${tthome.audit.url:}'.isEmpty()")
public class AuditAutoConfiguration {

	@Bean(destroyMethod = "close")
	@ConditionalOnMissingBean(AuditSender.class)
	HttpAuditSender auditSender(@org.springframework.beans.factory.annotation.Value("${tthome.audit.url}") String url) {
		return new HttpAuditSender(url);
	}

	@Bean
	WebMvcConfigurer auditInterceptorConfigurer(AuditSender sender) {
		return new WebMvcConfigurer() {
			@Override
			public void addInterceptors(InterceptorRegistry registry) {
				registry.addInterceptor(new AuditInterceptor(sender)).addPathPatterns(AuditInterceptor.ADMIN_BASE + "**");
			}
		};
	}

}
