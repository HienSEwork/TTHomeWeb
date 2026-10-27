package vn.tthome.listing.commons;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class SlugsTest {

	@Test
	void removesVietnameseDiacriticsAndJoinsWordsWithHyphens() {
		assertThat(Slugs.of("C\u0103n h\u1ed9 \u0110\u1ed3ng Nai")).isEqualTo("can-ho-dong-nai");
		assertThat(Slugs.of("\u0111\u01b0\u1eddng Nguy\u1ec5n Hu\u1ec7 123")).isEqualTo("duong-nguyen-hue-123");
	}

	@Test
	void collapsesSymbolsAndTrimsTheEnds() {
		assertThat(Slugs.of("  --Studio & Duplex!!  ")).isEqualTo("studio-duplex");
		assertThat(Slugs.of("A/B_C")).isEqualTo("a-b-c");
	}

	@Test
	void isEmptyWhenNothingUsableIsLeft() {
		assertThat(Slugs.of("???")).isEmpty();
		assertThat(Slugs.of("")).isEmpty();
	}

}
