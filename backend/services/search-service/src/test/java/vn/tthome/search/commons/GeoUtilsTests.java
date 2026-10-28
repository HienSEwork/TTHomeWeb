package vn.tthome.search.commons;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

import vn.tthome.common.error.ApiException;
import vn.tthome.search.models.dtos.BoundingBox;

class GeoUtilsTests {

	@Test
	void parsesBboxInMinLngMinLatMaxLngMaxLatOrder() {
		BoundingBox b = GeoUtils.parseBbox("105.70, 10.00,105.80,10.08");

		assertThat(b).isEqualTo(new BoundingBox(105.70, 10.00, 105.80, 10.08));
	}

	@Test
	void rejectsMalformedBbox() {
		for (String bad : new String[] { null, "", "1,2,3", "1,2,3,4,5", "a,b,c,d", "105.8,10,105.7,10.1",
				"105.7,10.1,105.8,10.0", "100,10,200,11", "100,-95,101,11", "NaN,1,2,3", "1,,3,4" }) {
			assertThatThrownBy(() -> GeoUtils.parseBbox(bad)).as(String.valueOf(bad)).isInstanceOf(ApiException.class);
		}
	}

	@Test
	void measuresGreatCircleDistanceInKm() {
		assertThat(GeoUtils.distanceKm(10.03, 105.77, 10.03, 105.77)).isZero();
		assertThat(GeoUtils.distanceKm(10.03, 105.77, 10.0345, 105.77)).isEqualTo(0.5);
	}

	@Test
	void formatsPriceLabels() {
		assertThat(GeoUtils.priceLabel(2_600_000)).isEqualTo("2,6 tr");
		assertThat(GeoUtils.priceLabel(3_000_000)).isEqualTo("3 tr");
		assertThat(GeoUtils.priceLabel(2_950_000)).isEqualTo("3 tr");
		assertThat(GeoUtils.priceLabel(12_500_000)).isEqualTo("12,5 tr");
		assertThat(GeoUtils.priceLabel(500_000)).isEqualTo("500k");
	}

}
