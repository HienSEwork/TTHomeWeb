package vn.tthome.report.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** The base addresses of the services that own the dashboard figures. */
@ConfigurationProperties("tthome.sources")
public record SourcesProperties(String listingUrl, String bookingUrl, String crmUrl, String consignmentUrl) {
}
