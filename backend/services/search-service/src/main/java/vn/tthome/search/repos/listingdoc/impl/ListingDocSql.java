package vn.tthome.search.repos.listingdoc.impl;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import vn.tthome.search.commons.QueryNormalizer;
import vn.tthome.search.models.dtos.SearchFilterRequest;
import vn.tthome.search.models.entities.ListingDoc;
import vn.tthome.search.models.enums.RoomType;

/**
 * Builds the dynamic WHERE clause (named parameters only, no user text in the
 * SQL) and maps rows.
 */
final class ListingDocSql {

	static final String COLUMNS = """
			room_id, project_id, project_code, room_slug, project_name, address, ward_id, ward_new_id,
			district_id, lat, lng, room_type, price, price_incl_utility, area_m2, furniture, has_balcony,
			has_window, is_exclusive, is_promo, pet_policy, ev_parking, amenity_ids, cover_url, status,
			rank_score, listed_at""";

	private final List<String> conditions = new ArrayList<>(List.of("status = 'available'"));
	private final Map<String, Object> params = new LinkedHashMap<>();

	ListingDocSql(SearchFilterRequest f) {
		if (f.keyword() != null && !f.keyword().isBlank()) {
			String[] words = f.keyword().split(" ");
			for (int i = 0; i < words.length; i++) {
				conditions.add("doc_text ILIKE :kw" + i);
				params.put("kw" + i, "%" + QueryNormalizer.escapeLike(words[i]) + "%");
			}
		}
		range("price", ">=", "priceMin", f.priceMin());
		range("price", "<=", "priceMax", f.priceMax());
		range("area_m2", ">=", "areaMin", f.areaMin());
		range("area_m2", "<=", "areaMax", f.areaMax());
		if (f.districtId() != null) {
			conditions.add("district_id = :districtId");
			params.put("districtId", f.districtId());
		}
		if (f.wardId() != null) {
			conditions.add("(ward_id = :wardId OR ward_new_id = :wardId)");
			params.put("wardId", f.wardId());
		}
		if (f.roomTypes() != null && !f.roomTypes().isEmpty()) {
			conditions.add("room_type IN (:roomTypes)");
			params.put("roomTypes", f.roomTypes().stream().map(RoomType::dbValue).toList());
		}
		if (f.amenityIds() != null && !f.amenityIds().isEmpty()) {
			conditions.add("amenity_ids @> CAST(:amenityIds AS smallint[])");
			params.put("amenityIds",
					"{" + String.join(",", f.amenityIds().stream().map(String::valueOf).toList()) + "}");
		}
		if (f.furniture() != null) {
			conditions.add("furniture = :furniture");
			params.put("furniture", f.furniture());
		}
		flag("has_balcony", f.hasBalcony());
		flag("has_window", f.hasWindow());
		flag("is_exclusive", f.exclusive());
		if (f.petFriendly()) {
			conditions.add("pet_policy IS NOT NULL AND pet_policy <> 'none'");
		}
		if (f.evParking()) {
			conditions.add("ev_parking = true");
		}
		if (f.promo()) {
			conditions.add("is_promo = true");
		}
	}

	private void range(String column, String op, String name, Object value) {
		if (value != null) {
			conditions.add(column + " " + op + " :" + name);
			params.put(name, value);
		}
	}

	private void flag(String column, Boolean value) {
		if (value != null) {
			conditions.add(column + " = " + value);
		}
	}

	void and(String condition) {
		conditions.add(condition);
	}

	void param(String name, Object value) {
		params.put(name, value);
	}

	String where() {
		return " WHERE " + String.join(" AND ", conditions);
	}

	Map<String, Object> params() {
		return params;
	}

	static ListingDoc map(ResultSet rs, int rowNum) throws SQLException {
		return new ListingDoc(rs.getObject("room_id", UUID.class), rs.getObject("project_id", UUID.class),
				rs.getString("project_code"), rs.getString("room_slug"), rs.getString("project_name"),
				rs.getString("address"), (Integer) rs.getObject("ward_id"), (Integer) rs.getObject("ward_new_id"),
				(Integer) rs.getObject("district_id"), (Double) rs.getObject("lat"), (Double) rs.getObject("lng"),
				rs.getString("room_type"), rs.getBigDecimal("price"), (Boolean) rs.getObject("price_incl_utility"),
				rs.getBigDecimal("area_m2"), rs.getString("furniture"), (Boolean) rs.getObject("has_balcony"),
				(Boolean) rs.getObject("has_window"), rs.getBoolean("is_exclusive"), rs.getBoolean("is_promo"),
				rs.getString("pet_policy"), (Boolean) rs.getObject("ev_parking"), shorts(rs, "amenity_ids"),
				rs.getString("cover_url"), rs.getString("status"), rs.getFloat("rank_score"),
				rs.getObject("listed_at", OffsetDateTime.class));
	}

	private static List<Short> shorts(ResultSet rs, String column) throws SQLException {
		java.sql.Array array = rs.getArray(column);
		if (array == null) {
			return List.of();
		}
		List<Short> out = new ArrayList<>();
		for (Object o : (Object[]) array.getArray()) {
			out.add(((Number) o).shortValue());
		}
		return out;
	}

}
