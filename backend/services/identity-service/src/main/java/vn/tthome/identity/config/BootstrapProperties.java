package vn.tthome.identity.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** First-administrator bootstrap (BOOTSTRAP_ADMIN_EMAIL / BOOTSTRAP_ADMIN_PASSWORD); both empty = disabled. */
@ConfigurationProperties("tthome.bootstrap")
public record BootstrapProperties(String adminEmail, String adminPassword) {
}
