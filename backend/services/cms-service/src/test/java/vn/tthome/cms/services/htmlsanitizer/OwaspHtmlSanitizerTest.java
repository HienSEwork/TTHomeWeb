package vn.tthome.cms.services.htmlsanitizer;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

import vn.tthome.cms.services.htmlsanitizer.impl.OwaspHtmlSanitizer;

class OwaspHtmlSanitizerTest {

	private final HtmlSanitizer sanitizer = new OwaspHtmlSanitizer();

	@Test
	void keepsTheFormattingAnEditorProduces() {
		String html = "<h2>Title</h2><p>Some <b>bold</b>, <i>italic</i> and <a href=\"https://example.com/x\">a link</a>.</p>"
				+ "<ul><li>one</li></ul><table><tbody><tr><td>cell</td></tr></tbody></table>"
				+ "<img src=\"https://res.cloudinary.com/demo/a.jpg\" alt=\"photo\" />";

		String clean = sanitizer.clean(html);

		assertThat(clean).contains("<h2>Title</h2>", "<b>bold</b>", "<i>italic</i>", "href=\"https://example.com/x\"",
				"<li>one</li>", "<td>cell</td>", "src=\"https://res.cloudinary.com/demo/a.jpg\"", "alt=\"photo\"");
	}

	@Test
	void dropsScriptsHandlersAndDangerousUrls() {
		String clean = sanitizer.clean("<p onclick=\"steal()\">hi</p><script>alert(1)</script>"
				+ "<a href=\"javascript:alert(2)\">x</a><img src=\"x\" onerror=\"alert(3)\">"
				+ "<iframe src=\"https://evil.example\"></iframe><style>p{color:red}</style>"
				+ "<a href=\"data:text/html,<script>alert(4)</script>\">y</a>");

		assertThat(clean).contains("hi").doesNotContain("script", "alert", "onclick", "onerror", "javascript:", "iframe",
				"<style", "data:");
	}

	@Test
	void linksAreNofollowAndCannotOpenNewWindows() {
		assertThat(sanitizer.clean("<a href=\"https://example.com\" target=\"_blank\">x</a>")).contains("rel=\"nofollow\"")
				.doesNotContain("target");
	}

	@Test
	void nullStaysNullAndPlainTextIsEscaped() {
		assertThat(sanitizer.clean(null)).isNull();
		assertThat(sanitizer.clean("1 < 2 & 3")).isEqualTo("1 &lt; 2 &amp; 3");
	}

}
