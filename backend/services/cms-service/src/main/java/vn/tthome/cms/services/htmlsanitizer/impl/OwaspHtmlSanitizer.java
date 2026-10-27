package vn.tthome.cms.services.htmlsanitizer.impl;

import org.owasp.html.HtmlPolicyBuilder;
import org.owasp.html.PolicyFactory;
import org.owasp.html.Sanitizers;
import org.springframework.stereotype.Service;

import vn.tthome.cms.services.htmlsanitizer.HtmlSanitizer;

@Service
public class OwaspHtmlSanitizer implements HtmlSanitizer {

	private static final PolicyFactory POLICY = Sanitizers.FORMATTING.and(Sanitizers.BLOCKS).and(Sanitizers.LINKS)
			.and(Sanitizers.IMAGES).and(Sanitizers.TABLES)
			.and(new HtmlPolicyBuilder().allowElements("h1", "h2", "h3", "h4", "h5", "h6", "figure", "figcaption", "hr")
					.toFactory());

	@Override
	public String clean(String html) {
		return html == null ? null : POLICY.sanitize(html);
	}

}
