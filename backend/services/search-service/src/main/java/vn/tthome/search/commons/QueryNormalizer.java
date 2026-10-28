package vn.tthome.search.commons;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/** Turns user text into the form stored in {@code listing_doc.doc_text}: lower case, no diacritics. */
public final class QueryNormalizer {

	private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
	private static final Pattern SPACES = Pattern.compile("\\s+");

	private QueryNormalizer() {
	}

	/** {@code "Cần Thơ"} becomes {@code "can tho"}; null and blank input become an empty string. */
	public static String normalize(String text) {
		if (text == null) {
			return "";
		}
		String lower = text.toLowerCase(Locale.ROOT).replace('đ', 'd');
		String stripped = DIACRITICS.matcher(Normalizer.normalize(lower, Normalizer.Form.NFD)).replaceAll("");
		return SPACES.matcher(stripped).replaceAll(" ").trim();
	}

	/** Escapes backslash, percent and underscore so user text can sit inside an {@code ILIKE '%...%'} pattern. */
	public static String escapeLike(String text) {
		return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
	}

}
