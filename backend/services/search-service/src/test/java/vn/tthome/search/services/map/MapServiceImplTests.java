package vn.tthome.search.services.map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import vn.tthome.common.error.ApiException;
import vn.tthome.search.models.dtos.BoundingBox;
import vn.tthome.search.models.dtos.MapResponse;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;
import vn.tthome.search.services.map.impl.MapServiceImpl;

class MapServiceImplTests {

	private static final String BBOX = "105.70,10.00,105.80,10.08";

	private final ListingDocRepository repo = mock(ListingDocRepository.class);
	private final MapService service = new MapServiceImpl(repo);

	private static SearchParams noFilters() {
		return new SearchParams(null, null, null, null, null, null, null, null, null, null, null, null, null, null,
				null, null, null, null, null);
	}

	private static ListingDoc doc() {
		return new ListingDoc(UUID.randomUUID(), UUID.randomUUID(), "P1", "room-1", "Minihouse", "addr", 1, null, 2,
				10.0315, 105.7665, "duplex", new BigDecimal("2600000"), true, new BigDecimal("25.5"), "full", false,
				true, false, false, "allowed", false, List.of(), "http://img", "available", 50f, OffsetDateTime.now());
	}

	@Test
	void mapsDocsToLightweightPins() {
		when(repo.findInBoundingBox(any(), eq(new BoundingBox(105.70, 10.00, 105.80, 10.08)), eq(200)))
				.thenReturn(List.of(doc()));

		MapResponse r = service.pins(BBOX, noFilters(), null);

		assertThat(r.totalPins()).isEqualTo(1);
		assertThat(r.pins()).singleElement().satisfies(p -> {
			assertThat(p.lat()).isEqualTo(10.0315);
			assertThat(p.lng()).isEqualTo(105.7665);
			assertThat(p.priceLabel()).isEqualTo("2,6 tr");
			assertThat(p.roomSlug()).isEqualTo("room-1");
			assertThat(p.thumbnailUrl()).isEqualTo("http://img");
			assertThat(p.petPolicy()).isEqualTo("allowed");
		});
	}

	@Test
	void passesCustomLimitAndValidatesInput() {
		service.pins(BBOX, noFilters(), 50);
		verify(repo).findInBoundingBox(any(), any(), eq(50));

		assertThatThrownBy(() -> service.pins(BBOX, noFilters(), 501)).isInstanceOf(ApiException.class);
		assertThatThrownBy(() -> service.pins(BBOX, noFilters(), 0)).isInstanceOf(ApiException.class);
		assertThatThrownBy(() -> service.pins(null, noFilters(), null)).isInstanceOf(ApiException.class);
		assertThatThrownBy(() -> service.pins("bad", noFilters(), null)).isInstanceOf(ApiException.class);
	}

}
