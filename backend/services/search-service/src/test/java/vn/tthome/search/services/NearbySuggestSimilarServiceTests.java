package vn.tthome.search.services;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import vn.tthome.common.error.ApiException;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.dtos.SuggestItemResponse;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.nearby.impl.NearbyServiceImpl;
import vn.tthome.search.services.similar.impl.SimilarRoomServiceImpl;
import vn.tthome.search.services.suggest.impl.SuggestServiceImpl;

class NearbySuggestSimilarServiceTests {

	private final ListingDocRepository repo = mock(ListingDocRepository.class);

	private static SearchParams noFilters() {
		return new SearchParams(null, null, null, null, null, null, null, null, null, null, null, null, null, null,
				null, null, null, null, null);
	}

	private static ListingDoc doc(Double lat, Double lng, BigDecimal price, Integer district) {
		return new ListingDoc(UUID.randomUUID(), UUID.randomUUID(), "P1", "room-1", "Minihouse", "addr", 1, null,
				district, lat, lng, "duplex", price, true, new BigDecimal("25"), "full", false, true, false, false,
				"allowed", false, List.of(), "http://img", "available", 50f, OffsetDateTime.now());
	}

	@Test
	void nearbyAddsDistanceAndUsesDefaults() {
		when(repo.findNearby(any(), eq(10.03), eq(105.77), eq(2000), eq(20)))
				.thenReturn(List.of(doc(10.0345, 105.77, new BigDecimal("2000000"), 1)));

		var r = new NearbyServiceImpl(repo).nearby(10.03, 105.77, null, noFilters(), null);

		assertThat(r.total()).isEqualTo(1);
		assertThat(r.items().get(0).distanceKm()).isEqualTo(0.5);
		assertThat(r.items().get(0).room().roomSlug()).isEqualTo("room-1");
	}

	@Test
	void nearbyRejectsBadInput() {
		var service = new NearbyServiceImpl(repo);

		assertThatThrownBy(() -> service.nearby(null, 105.77, null, noFilters(), null)).isInstanceOf(ApiException.class);
		assertThatThrownBy(() -> service.nearby(91.0, 105.77, null, noFilters(), null)).isInstanceOf(ApiException.class);
		assertThatThrownBy(() -> service.nearby(10.0, 105.77, 20_001, noFilters(), null))
				.isInstanceOf(ApiException.class);
		assertThatThrownBy(() -> service.nearby(10.0, 105.77, 0, noFilters(), null)).isInstanceOf(ApiException.class);
		assertThatThrownBy(() -> service.nearby(10.0, 105.77, null, noFilters(), 51)).isInstanceOf(ApiException.class);
		verifyNoInteractions(repo);
	}

	@Test
	void suggestNormalisesTheQueryAndSkipsBlank() {
		var item = new SuggestItemResponse("P1", "Minihouse", 3);
		when(repo.suggestProjects("hem 51", 8)).thenReturn(List.of(item));
		var service = new SuggestServiceImpl(repo);

		assertThat(service.suggest("  Hẻm 51 ")).containsExactly(item);
		assertThat(service.suggest("  ")).isEmpty();
		assertThat(service.suggest(null)).isEmpty();
		assertThatThrownBy(() -> service.suggest("a".repeat(101))).isInstanceOf(ApiException.class);
		verify(repo).suggestProjects("hem 51", 8);
	}

	@Test
	void similarReturnsMatchesAndThrows404ForUnknownRoom() {
		ListingDoc base = doc(10.03, 105.77, new BigDecimal("3000000"), 1);
		when(repo.findById(base.roomId())).thenReturn(Optional.of(base));
		when(repo.findSimilar(base, 4)).thenReturn(List.of(doc(10.03, 105.77, new BigDecimal("3100000"), 1)));
		var service = new SimilarRoomServiceImpl(repo);

		assertThat(service.similar(base.roomId())).hasSize(1);
		UUID unknown = UUID.randomUUID();
		when(repo.findById(unknown)).thenReturn(Optional.empty());
		assertThatThrownBy(() -> service.similar(unknown)).isInstanceOf(ApiException.class)
				.hasMessageContaining("not found");
	}

	@Test
	void similarIsEmptyWhenTheRoomHasNoPriceOrDistrict() {
		ListingDoc base = doc(10.03, 105.77, null, 1);
		when(repo.findById(base.roomId())).thenReturn(Optional.of(base));

		assertThat(new SimilarRoomServiceImpl(repo).similar(base.roomId())).isEmpty();
	}

}
