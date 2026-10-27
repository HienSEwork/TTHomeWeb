package vn.tthome.cms.services.htmlsanitizer;

/** Cleans editor HTML before it is stored, since the web site renders it as it is. */
public interface HtmlSanitizer {

	/**
	 * Keeps text formatting, blocks, links, images and tables and drops everything else (scripts, event handlers,
	 * styles, iframes, javascript: links); links get rel="nofollow" and cannot open new windows. Null stays null.
	 */
	String clean(String html);

}
