package vn.tthome.search.services.search;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.dtos.SearchResponse;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.search.impl.SearchServiceImpl;

class SearchServiceImplTests {

	private final ListingDocRepository repo = mock(ListingDocRepository.class);
	private final SearchService service = new SearchServiceImpl(repo);

	private static SearchParams page(int page, int limit) {
		return new SearchParams(null, null, null, null, null, null, null, null, null, null, null, null, null, null,
				null, null, null, page, limit);
	}

	private static ListingDoc doc() {
		return new ListingDoc(UUID.randomUUID(), UUID.randomUUID(), "P1", "room-1", "Minihouse", "addr", 1, null, 2,
				10.03, 105.76, "duplex", new BigDecimal("2600000"), true, new BigDecimal("25.5"), "full", true, true,
				false, false, "allowed", false, List.of((short) 1), "http://img", "available", 50f,
				OffsetDateTime.now());
	}

	@Test
	void returnsMappedPageWithTotals() {
		when(repo.count(any())).thenReturn(45L);
		when(repo.search(any())).thenReturn(List.of(doc()));

		SearchResponse r = service.search(page(2, 20));

		assertThat(r.total()).isEqualTo(45);
		assertThat(r.totalPages()).isEqualTo(3);
		assertThat(r.page()).isEqualTo(2);
		assertThat(r.items()).singleElement().satisfies(i -> {
			assertThat(i.price()).isEqualTo(2_600_000L);
			assertThat(i.areaM2()).isEqualTo(25.5);
			assertThat(i.roomType()).isEqualTo("duplex");
		});
	}

	@Test
	void skipsRowQueryWhenNothingMatchesOrPageIsPastTheEnd() {
		when(repo.count(any())).thenReturn(0L);
		assertThat(service.search(page(1, 20)).items()).isEmpty();

		when(repo.count(any())).thenReturn(5L);
		SearchResponse past = service.search(page(3, 20));
		assertThat(past.items()).isEmpty();
		assertThat(past.totalPages()).isEqualTo(1);

		verify(repo, never()).search(any());
	}

}
