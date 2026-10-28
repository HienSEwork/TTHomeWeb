package vn.tthome.search.repos.listingdoc.impl;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import vn.tthome.search.commons.QueryNormalizer;
import vn.tthome.search.models.dtos.BoundingBox;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.dtos.SuggestItemResponse;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.repos.listingdoc.ListingDocRepository;

@Repository
public class ListingDocRepositoryImpl implements ListingDocRepository {

	// shortcut: plain haversine (sphere), not earthdistance (no extension in the schema); fine at city scale, switch to a GiST index past ~100k rooms.
	private static final String HAVERSINE_KM = """
			(12742.0 * asin(sqrt(least(1.0, power(sin(radians(lat - :cLat) / 2), 2)
			  + cos(radians(:cLat)) * cos(radians(lat)) * power(sin(radians(lng - :cLng) / 2), 2)))))""";

	private final JdbcClient jdbc;

	public ListingDocRepositoryImpl(JdbcClient jdbc) {
		this.jdbc = jdbc;
	}

	@Override
	public List<ListingDoc> search(SearchFilterRequest filter) {
		ListingDocSql sql = new ListingDocSql(filter);
		String query = "SELECT " + ListingDocSql.COLUMNS + " FROM search.listing_doc" + sql.where()
				+ " ORDER BY " + filter.sort().orderBy() + ", room_id LIMIT :limit OFFSET :offset";
		sql.param("limit", filter.limit());
		sql.param("offset", filter.offset());
		return jdbc.sql(query).params(sql.params()).query(ListingDocSql::map).list();
	}

	@Override
	public List<ListingDoc> findInBoundingBox(SearchFilterRequest filter, BoundingBox bbox, int limit) {
		ListingDocSql sql = new ListingDocSql(filter);
		sql.and("lat BETWEEN :south AND :north AND lng BETWEEN :west AND :east");
		sql.param("south", bbox.minLat());
		sql.param("north", bbox.maxLat());
		sql.param("west", bbox.minLng());
		sql.param("east", bbox.maxLng());
		sql.param("limit", limit);
		String query = "SELECT " + ListingDocSql.COLUMNS + " FROM search.listing_doc" + sql.where()
				+ " ORDER BY rank_score DESC, room_id LIMIT :limit";
		return jdbc.sql(query).params(sql.params()).query(ListingDocSql::map).list();
	}

	@Override
	public List<ListingDoc> findNearby(SearchFilterRequest filter, double lat, double lng, int radiusM, int limit) {
		double radiusKm = radiusM / 1000.0;
		double dLat = radiusKm / 111.0;
		double dLng = radiusKm / (111.0 * Math.max(Math.cos(Math.toRadians(lat)), 0.01));
		ListingDocSql sql = new ListingDocSql(filter);
		sql.and("lat BETWEEN :south AND :north AND lng BETWEEN :west AND :east");
		sql.and(HAVERSINE_KM + " <= :radiusKm");
		sql.param("south", lat - dLat);
		sql.param("north", lat + dLat);
		sql.param("west", lng - dLng);
		sql.param("east", lng + dLng);
		sql.param("cLat", lat);
		sql.param("cLng", lng);
		sql.param("radiusKm", radiusKm);
		sql.param("limit", limit);
		String query = "SELECT " + ListingDocSql.COLUMNS + " FROM search.listing_doc" + sql.where()
				+ " ORDER BY " + HAVERSINE_KM + ", room_id LIMIT :limit";
		return jdbc.sql(query).params(sql.params()).query(ListingDocSql::map).list();
	}

	@Override
	public List<SuggestItemResponse> suggestProjects(String keyword, int limit) {
		return jdbc.sql("""
				SELECT project_code, min(project_name) AS name, count(*) AS room_count
				FROM search.listing_doc
				WHERE status = 'available' AND doc_text ILIKE :kw
				GROUP BY project_code
				ORDER BY room_count DESC, project_code
				LIMIT :limit""")
				.param("kw", "%" + QueryNormalizer.escapeLike(keyword) + "%").param("limit", limit)
				.query((rs, i) -> new SuggestItemResponse(rs.getString("project_code"), rs.getString("name"),
						rs.getLong("room_count")))
				.list();
	}

	@Override
	public Optional<ListingDoc> findById(UUID roomId) {
		return jdbc.sql("SELECT " + ListingDocSql.COLUMNS + " FROM search.listing_doc WHERE room_id = :id")
				.param("id", roomId).query(ListingDocSql::map).optional();
	}

	@Override
	public List<ListingDoc> findSimilar(ListingDoc base, int limit) {
		return jdbc.sql("SELECT " + ListingDocSql.COLUMNS + " FROM search.listing_doc " + """
				WHERE status = 'available' AND room_id <> :id AND district_id = :district AND room_type = :type
				  AND price BETWEEN :low AND :high
				ORDER BY abs(price - :price), room_id
				LIMIT :limit""")
				.param("id", base.roomId()).param("district", base.districtId()).param("type", base.roomType())
				.param("low", base.price().multiply(new BigDecimal("0.8")))
				.param("high", base.price().multiply(new BigDecimal("1.2"))).param("price", base.price())
				.param("limit", limit).query(ListingDocSql::map).list();
	}

	@Override
	public long count(SearchFilterRequest filter) {
		ListingDocSql sql = new ListingDocSql(filter);
		return jdbc.sql("SELECT count(*) FROM search.listing_doc" + sql.where()).params(sql.params())
				.query(Long.class).single();
	}

}
