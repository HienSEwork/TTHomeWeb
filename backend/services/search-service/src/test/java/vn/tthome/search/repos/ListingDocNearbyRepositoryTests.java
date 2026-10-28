package vn.tthome.search.repos;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import vn.tthome.search.SearchIntegrationTestBase;
import vn.tthome.search.commons.SearchFilters;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;

class ListingDocNearbyRepositoryTests extends SearchIntegrationTestBase {

	@Autowired
	ListingDocRepository repo;

	private static SearchFilterRequest noFilter() {
		return SearchFilters.from(new SearchParams(null, null, null, null, null, null, null, null, null, null, null,
				null, null, null, null, null, null, null, null));
	}

	private static List<String> slugs(List<ListingDoc> docs) {
		return docs.stream().map(ListingDoc::roomSlug).toList();
	}

	@Test
	void nearbyReturnsRoomsInsideRadiusNearestFirst() {
		insertListing("nb-far", "x", "duplex", 2_000_000, "available", 10.0100, 105.7700, null, false, "{}");
		insertListing("nb-near", "x", "duplex", 2_000_000, "available", 10.0305, 105.7700, null, false, "{}");
		insertListing("nb-mid", "x", "duplex", 2_000_000, "available", 10.0400, 105.7700, null, false, "{}");
		insertListing("nb-gone", "x", "duplex", 2_000_000, "rented", 10.0300, 105.7700, null, false, "{}");
		insertListing("nb-nocoord", "x", "duplex", 2_000_000, "available", null, null, null, false, "{}");

		assertThat(slugs(repo.findNearby(noFilter(), 10.0300, 105.7700, 2000, 10))).containsExactly("nb-near", "nb-mid");
		assertThat(slugs(repo.findNearby(noFilter(), 10.0300, 105.7700, 2000, 1))).containsExactly("nb-near");
		assertThat(slugs(repo.findNearby(noFilter(), 10.0300, 105.7700, 10, 10))).isEmpty();
	}

	@Test
	void suggestGroupsAvailableRoomsByProject() {
		insertListing("sg-1", "tthome ctu hem 51", "duplex", 2_000_000, "available", 10.03, 105.76, null, false, "{}");
		insertListing("sg-2", "tthome ctu hem 51", "studio", 2_000_000, "available", 10.03, 105.76, null, false, "{}");
		insertListing("sg-3", "tthome ctu hem 51", "studio", 2_000_000, "rented", 10.03, 105.76, null, false, "{}");

		var out = repo.suggestProjects("hem 51", 8);

		assertThat(out).extracting(s -> s.projectCode() + ":" + s.roomCount()).containsExactlyInAnyOrder("IT-sg-1:1",
				"IT-sg-2:1");
		assertThat(repo.suggestProjects("khong co", 8)).isEmpty();
	}

	@Test
	void similarKeepsSameDistrictTypeAndPriceWithin20PercentClosestFirst() {
		UUID base = insertListing("sm-base", "x", "duplex", 3_000_000, "available", 10.03, 105.76, null, false, "{}");
		insertListing("sm-close", "x", "duplex", 3_100_000, "available", 10.03, 105.76, null, false, "{}");
		insertListing("sm-edge", "x", "duplex", 3_600_000, "available", 10.03, 105.76, null, false, "{}");
		insertListing("sm-pricey", "x", "duplex", 3_700_000, "available", 10.03, 105.76, null, false, "{}");
		insertListing("sm-type", "x", "studio", 3_000_000, "available", 10.03, 105.76, null, false, "{}");
		insertListing("sm-rented", "x", "duplex", 3_000_000, "rented", 10.03, 105.76, null, false, "{}");

		ListingDoc doc = repo.findById(base).orElseThrow();

		assertThat(slugs(repo.findSimilar(doc, 4))).containsExactly("sm-close", "sm-edge");
		assertThat(repo.findById(UUID.randomUUID())).isEmpty();
	}

}
