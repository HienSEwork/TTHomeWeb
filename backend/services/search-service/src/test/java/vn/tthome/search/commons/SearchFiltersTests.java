package vn.tthome.search.commons;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;

import org.junit.jupiter.api.Test;

import vn.tthome.common.error.ApiException;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.enums.RoomType;
import vn.tthome.search.models.enums.SortOption;

class SearchFiltersTests {

	private static SearchParams params() {
		return new SearchParams(null, null, null, null, null, null, null, null, null, null, null, null, null, null,
				null, null, null, null, null);
	}

	private static SearchParams with(java.util.function.UnaryOperator<Builder> change) {
		return change.apply(new Builder()).build();
	}

	@Test
	void appliesDefaults() {
		SearchFilterRequest f = SearchFilters.from(params());

		assertThat(f.keyword()).isEmpty();
		assertThat(f.sort()).isEqualTo(SortOption.NEWEST);
		assertThat(f.page()).isEqualTo(1);
		assertThat(f.limit()).isEqualTo(20);
		assertThat(f.offset()).isZero();
		assertThat(f.roomTypes()).isEmpty();
		assertThat(f.petFriendly()).isFalse();
	}

	@Test
	void normalisesKeywordAndParsesRoomTypes() {
		SearchFilterRequest f = SearchFilters.from(with(b -> b.q("Hẻm 51 Hồ Bún Xáng").roomType(List.of("duplex,1pn", "STUDIO"))
				.sort("price_asc").page(3).limit(10)));

		assertThat(f.keyword()).isEqualTo("hem 51 ho bun xang");
		assertThat(f.roomTypes()).containsExactly(RoomType.DUPLEX, RoomType.ONE_BED, RoomType.STUDIO);
		assertThat(f.sort()).isEqualTo(SortOption.PRICE_ASC);
		assertThat(f.offset()).isEqualTo(20);
	}

	@Test
	void rejectsInvalidInput() {
		assertInvalid(with(b -> b.priceMin(5L).priceMax(1L)));
		assertInvalid(with(b -> b.priceMin(-1L)));
		assertInvalid(with(b -> b.areaMin(30.0).areaMax(10.0)));
		assertInvalid(with(b -> b.roomType(List.of("castle"))));
		assertInvalid(with(b -> b.sort("random")));
		assertInvalid(with(b -> b.furniture("lots")));
		assertInvalid(with(b -> b.page(0)));
		assertInvalid(with(b -> b.limit(0)));
		assertInvalid(with(b -> b.limit(51)));
		assertInvalid(with(b -> b.q("x".repeat(101))));
	}

	private static void assertInvalid(SearchParams p) {
		assertThatThrownBy(() -> SearchFilters.from(p)).isInstanceOf(ApiException.class)
				.satisfies(e -> assertThat(((ApiException) e).code()).isEqualTo("VALIDATION_ERROR"));
	}

	/** Small test builder so each case only states the fields it cares about. */
	static final class Builder {

		private String q;
		private Long priceMin;
		private Long priceMax;
		private List<String> roomType;
		private Double areaMin;
		private Double areaMax;
		private String furniture;
		private String sort;
		private Integer page;
		private Integer limit;

		Builder q(String v) {
			q = v;
			return this;
		}

		Builder priceMin(Long v) {
			priceMin = v;
			return this;
		}

		Builder priceMax(Long v) {
			priceMax = v;
			return this;
		}

		Builder roomType(List<String> v) {
			roomType = v;
			return this;
		}

		Builder areaMin(Double v) {
			areaMin = v;
			return this;
		}

		Builder areaMax(Double v) {
			areaMax = v;
			return this;
		}

		Builder furniture(String v) {
			furniture = v;
			return this;
		}

		Builder sort(String v) {
			sort = v;
			return this;
		}

		Builder page(Integer v) {
			page = v;
			return this;
		}

		Builder limit(Integer v) {
			limit = v;
			return this;
		}

		SearchParams build() {
			return new SearchParams(q, priceMin, priceMax, null, null, roomType, null, areaMin, areaMax, furniture,
					null, null, null, null, null, null, sort, page, limit);
		}

	}

}
