package vn.tthome.search.repos;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import vn.tthome.search.SearchIntegrationTestBase;
import vn.tthome.search.commons.SearchFilters;
import vn.tthome.search.models.dtos.BoundingBox;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SearchParams;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;

class ListingDocRepositoryTests extends SearchIntegrationTestBase {

	@Autowired
	ListingDocRepository repo;

	private static SearchFilterRequest filter(String q, Long priceMax, List<String> types, List<Short> amenities,
			Boolean pet, String sort, Integer page, Integer limit) {
		return SearchFilters.from(new SearchParams(q, null, priceMax, null, null, types, amenities, null, null, null,
				null, null, null, pet, null, null, sort, page, limit));
	}

	private static List<String> slugs(List<ListingDoc> docs) {
		return docs.stream().map(ListingDoc::roomSlug).toList();
	}

	private void seed() {
		insertListing("it-a", "minihouse duplex gac cao hem 51 ninh kieu", "duplex", 2_600_000, "available", 10.03, 105.76,
				"allowed", false, "{1,4}");
		insertListing("it-b", "studio vincom xuan khanh ninh kieu", "studio", 4_000_000, "available", 10.02, 105.77,
				"none", true, "{1}");
		insertListing("it-c", "duplex cai rang", "duplex", 3_500_000, "available", 10.00, 105.76, null, false, "{}");
		insertListing("it-d", "duplex da thue ninh kieu", "duplex", 2_000_000, "rented", 10.03, 105.76, "allowed",
				false, "{1,4}");
	}

	@Test
	void keywordIsAccentInsensitiveAndAllWordsMustMatch() {
		seed();

		assertThat(slugs(repo.search(filter("Ninh Kiều", null, null, null, null, "price_asc", null, null))))
				.containsExactly("it-a", "it-b");
		assertThat(slugs(repo.search(filter("hẻm 51 gác", null, null, null, null, null, null, null))))
				.containsExactly("it-a");
	}

	@Test
	void filtersByPriceTypeAmenitiesAndShortcutsAndHidesUnavailableRooms() {
		seed();

		assertThat(slugs(repo.search(filter("ninh kieu", 3_000_000L, List.of("duplex"), null, null, null, null, null))))
				.containsExactly("it-a");
		assertThat(slugs(repo.search(filter("ninh kieu", null, null, List.of((short) 1, (short) 4), null, null, null,
				null)))).containsExactly("it-a");
		assertThat(slugs(repo.search(filter("ninh kieu", null, null, null, true, null, null, null))))
				.containsExactly("it-a");
	}

	@Test
	void sortsAndPaginatesWithMatchingCount() {
		seed();
		SearchFilterRequest first = filter("duplex", null, null, null, null, "price_desc", 1, 1);
		SearchFilterRequest second = filter("duplex", null, null, null, null, "price_desc", 2, 1);

		assertThat(repo.count(first)).isEqualTo(2);
		assertThat(slugs(repo.search(first))).containsExactly("it-c");
		assertThat(slugs(repo.search(second))).containsExactly("it-a");
	}

	@Test
	void findsPinsInsideViewportOnly() {
		seed();
		insertListing("it-e", "no coordinates", "studio", 1_000_000, "available", null, null, null, false, "{}");
		SearchFilterRequest all = filter(null, null, null, null, null, null, null, null);
		SearchFilterRequest cheap = filter(null, 3_000_000L, null, null, null, null, null, null);

		List<ListingDoc> inBox = repo.findInBoundingBox(all, new BoundingBox(105.70, 10.01, 105.80, 10.08), 10);
		List<ListingDoc> narrowed = repo.findInBoundingBox(cheap, new BoundingBox(105.70, 10.01, 105.80, 10.08), 10);
		List<ListingDoc> capped = repo.findInBoundingBox(all, new BoundingBox(105.70, 10.00, 105.80, 10.08), 1);

		assertThat(slugs(inBox)).containsExactlyInAnyOrder("it-a", "it-b");
		assertThat(slugs(narrowed)).containsExactly("it-a");
		assertThat(capped).hasSize(1);
	}

	@Test
	void keywordWildcardsAreTreatedAsLiterals() {
		seed();

		assertThat(repo.count(filter("%", null, null, null, null, null, null, null))).isZero();
		assertThat(repo.count(filter("hem_51", null, null, null, null, null, null, null))).isZero();
	}

}
