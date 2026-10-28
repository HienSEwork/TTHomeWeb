package vn.tthome.search.commons;

import vn.tthome.common.error.ApiException;
import vn.tthome.search.models.dtos.BoundingBox;

public final class GeoUtils {

	private GeoUtils() {
	}

	/** Parses {@code minLng,minLat,maxLng,maxLat} (the order MapLibre/Leaflet bounds produce); throws a 400 when malformed. */
	public static BoundingBox parseBbox(String bbox) {
		if (bbox == null || bbox.isBlank()) {
			throw SearchFilters.invalid("bbox is required: minLng,minLat,maxLng,maxLat");
		}
		String[] parts = bbox.split(",", -1);
		if (parts.length != 4) {
			throw SearchFilters.invalid("bbox must have 4 comma-separated numbers: minLng,minLat,maxLng,maxLat");
		}
		double[] v = new double[4];
		for (int i = 0; i < 4; i++) {
			try {
				v[i] = Double.parseDouble(parts[i].trim());
			}
			catch (NumberFormatException e) {
				throw SearchFilters.invalid("bbox contains a non-numeric value");
			}
			if (!Double.isFinite(v[i])) {
				throw SearchFilters.invalid("bbox contains a non-finite value");
			}
		}
		BoundingBox box = new BoundingBox(v[0], v[1], v[2], v[3]);
		if (box.minLng() < -180 || box.maxLng() > 180 || box.minLat() < -90 || box.maxLat() > 90) {
			throw SearchFilters.invalid("bbox is outside valid longitude/latitude range");
		}
		if (box.minLng() >= box.maxLng() || box.minLat() >= box.maxLat()) {
			throw SearchFilters.invalid("bbox min values must be smaller than max values");
		}
		return box;
	}

	/** Great-circle distance in km, rounded to 10 m. */
	public static double distanceKm(double lat1, double lng1, double lat2, double lng2) {
		double a = Math.pow(Math.sin(Math.toRadians(lat2 - lat1) / 2), 2) + Math.cos(Math.toRadians(lat1))
				* Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(Math.toRadians(lng2 - lng1) / 2), 2);
		return Math.round(12742.0 * Math.asin(Math.sqrt(Math.min(1.0, a))) * 100) / 100.0;
	}

	/** Short price for a map pin: 2600000 becomes {@code "2,6 tr"}, 3000000 {@code "3 tr"}, 500000 {@code "500k"}. */
	public static String priceLabel(long price) {
		if (price < 1_000_000) {
			return (price / 1000) + "k";
		}
		long tenths = Math.round(price / 100_000.0);
		String whole = String.valueOf(tenths / 10);
		return (tenths % 10 == 0 ? whole : whole + "," + (tenths % 10)) + " tr";
	}

}
