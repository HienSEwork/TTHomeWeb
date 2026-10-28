package vn.tthome.search;

import java.math.BigDecimal;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;

/** Full application context on a Testcontainers PostgreSQL initialised with db/tthome_schema.sql (Flyway V1). */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public abstract class SearchIntegrationTestBase {

	protected static final String PROJECT_PREFIX = "IT-";

	@Autowired
	protected JdbcClient jdbc;

	@AfterEach
	void cleanListings() {
		jdbc.sql("DELETE FROM search.listing_doc WHERE project_code LIKE :p").param("p", PROJECT_PREFIX + "%").update();
	}

	/** Inserts one listing_doc row; doc_text is the already-normalised text the keyword search matches on. */
	protected UUID insertListing(String slug, String docText, String roomType, long price, String status, Double lat,
			Double lng, String petPolicy, boolean promo, String amenityArrayLiteral) {
		UUID id = UUID.randomUUID();
		jdbc.sql("""
				INSERT INTO search.listing_doc (room_id, project_id, project_code, room_slug, project_name, district_id,
				  lat, lng, room_type, price, status, pet_policy, is_promo, amenity_ids, doc_text, area_m2, listed_at)
				VALUES (:id, :pid, :code, :slug, :name, 916, :lat, :lng, :type, :price, :status, :pet, :promo,
				  CAST(:amenities AS smallint[]), :doc, :area, now())""")
				.param("id", id).param("pid", UUID.randomUUID()).param("code", PROJECT_PREFIX + slug).param("slug", slug)
				.param("name", "Project " + slug).param("lat", lat).param("lng", lng).param("type", roomType)
				.param("price", BigDecimal.valueOf(price)).param("status", status).param("pet", petPolicy)
				.param("promo", promo).param("amenities", amenityArrayLiteral).param("doc", docText)
				.param("area", BigDecimal.valueOf(20)).update();
		return id;
	}

}
