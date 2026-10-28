package vn.tthome.search.commons;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class QueryNormalizerTests {

	@Test
	void stripsVietnameseDiacriticsAndLowercases() {
		assertThat(QueryNormalizer.normalize("Cần Thơ")).isEqualTo("can tho");
		assertThat(QueryNormalizer.normalize("Đại học Y Dược")).isEqualTo("dai hoc y duoc");
	}

	@Test
	void collapsesWhitespaceAndHandlesEmptyInput() {
		assertThat(QueryNormalizer.normalize("  Hẻm   51 ")).isEqualTo("hem 51");
		assertThat(QueryNormalizer.normalize(null)).isEmpty();
		assertThat(QueryNormalizer.normalize("   ")).isEmpty();
	}

	@Test
	void escapesLikeWildcards() {
		assertThat(QueryNormalizer.escapeLike("50%_a\\b")).isEqualTo("50\\%\\_a\\\\b");
	}

}
