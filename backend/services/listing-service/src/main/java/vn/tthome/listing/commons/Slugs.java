package vn.tthome.listing.commons;

import java.text.Normalizer;
import java.util.Locale;

public final class Slugs {

	private Slugs() {
	}

	/** Lower-case ASCII words joined by hyphens, with Vietnamese diacritics removed; empty when nothing is left. */
	public static String of(String text) {
		String plain = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}+", "")
				.replace('\u0111', 'd').replace('\u0110', 'd');
		return plain.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-").replaceAll("^-+|-+$", "");
	}

}
