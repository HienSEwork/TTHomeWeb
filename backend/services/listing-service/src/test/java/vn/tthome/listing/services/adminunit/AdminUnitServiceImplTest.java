package vn.tthome.listing.services.adminunit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.AdminUnitCreateRequest;
import vn.tthome.listing.models.dtos.AdminUnitResponse;
import vn.tthome.listing.models.dtos.AdminUnitUpdateRequest;
import vn.tthome.listing.models.entities.AdminUnit;
import vn.tthome.listing.repos.adminunit.AdminUnitRepository;
import vn.tthome.listing.services.adminunit.impl.AdminUnitServiceImpl;

@ExtendWith(MockitoExtension.class)
class AdminUnitServiceImplTest {

	@Mock
	AdminUnitRepository units;

	private AdminUnitServiceImpl service() {
		return new AdminUnitServiceImpl(units);
	}

	private static AdminUnit unit(int id, Integer parent, int level, String scheme, String slug) {
		AdminUnit unit = new AdminUnit();
		unit.setId(id);
		unit.setParentId(parent);
		unit.setLevel((short) level);
		unit.setScheme(scheme);
		unit.setName("Name " + id);
		unit.setSlug(slug);
		return unit;
	}

	private static AdminUnitCreateRequest create(int id, Integer parent, int level, String scheme, String slug) {
		return new AdminUnitCreateRequest(id, parent, (short) level, scheme, " Quan 1 ", slug, 10.5, 106.5);
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createsAProvinceWithoutAParent() {
		when(units.saveAndFlush(any(AdminUnit.class))).thenAnswer(call -> call.getArgument(0));

		AdminUnitResponse response = service().create(create(79, null, 1, "pre_2025", "ho-chi-minh"));

		ArgumentCaptor<AdminUnit> saved = ArgumentCaptor.forClass(AdminUnit.class);
		verify(units).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getName()).isEqualTo("Quan 1");
		assertThat(saved.getValue().getParentId()).isNull();
		assertThat(response.id()).isEqualTo(79);
		assertThat(response.level()).isEqualTo((short) 1);
		assertThat(response.centerLat()).isEqualTo(10.5);
	}

	@Test
	void createsADistrictUnderAProvinceOfTheSameScheme() {
		when(units.findById(79)).thenReturn(Optional.of(unit(79, null, 1, "pre_2025", "ho-chi-minh")));
		when(units.saveAndFlush(any(AdminUnit.class))).thenAnswer(call -> call.getArgument(0));

		AdminUnitResponse response = service().create(create(760, 79, 2, "pre_2025", "quan-1"));

		assertThat(response.parentId()).isEqualTo(79);
	}

	@Test
	void rejectsAParentThatDoesNotFit() {
		when(units.findById(79)).thenReturn(Optional.of(unit(79, null, 1, "pre_2025", "ho-chi-minh")));
		when(units.findById(760)).thenReturn(Optional.of(unit(760, 79, 2, "pre_2025", "quan-1")));
		when(units.findById(404)).thenReturn(Optional.empty());

		for (AdminUnitCreateRequest bad : List.of(create(1, 79, 1, "pre_2025", "a"), // a province with a parent
				create(2, null, 2, "pre_2025", "b"), // a district without one
				create(3, 404, 2, "pre_2025", "c"), // an unknown parent
				create(4, 760, 2, "pre_2025", "d"), // a district under a district
				create(5, 79, 3, "pre_2025", "e"), // a ward directly under a province
				create(6, 79, 2, "post_2025", "f"))) { // another scheme than the parent
			assertThatThrownBy(() -> service().create(bad))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		verify(units, never()).saveAndFlush(any());
	}

	@Test
	void createRefusesATakenIdAndATakenSlug() {
		when(units.existsById(79)).thenReturn(true);
		when(units.existsBySchemeAndParentIdAndSlug("pre_2025", null, "ho-chi-minh")).thenReturn(true);

		assertThatThrownBy(() -> service().create(create(79, null, 1, "pre_2025", "other")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().create(create(80, null, 1, "pre_2025", "ho-chi-minh")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));

		verify(units, never()).saveAndFlush(any());
	}

	@Test
	void updateChangesOnlyNamingAndTheMapCentre() {
		AdminUnit existing = unit(760, 79, 2, "pre_2025", "quan-1");
		when(units.findById(760)).thenReturn(Optional.of(existing));
		when(units.saveAndFlush(existing)).thenReturn(existing);

		AdminUnitResponse response = service().update(760,
				new AdminUnitUpdateRequest(" District 1 ", "district-1", 1.0, 2.0));

		assertThat(response.name()).isEqualTo("District 1");
		assertThat(response.slug()).isEqualTo("district-1");
		assertThat(response.centerLng()).isEqualTo(2.0);
		assertThat(response.parentId()).isEqualTo(79);
		assertThat(response.level()).isEqualTo((short) 2);
		assertThat(response.scheme()).isEqualTo("pre_2025");
	}

	@Test
	void updateRefusesASlugUsedByASiblingAndAnUnknownUnit() {
		AdminUnit existing = unit(760, 79, 2, "pre_2025", "quan-1");
		when(units.findById(760)).thenReturn(Optional.of(existing));
		when(units.findById(1)).thenReturn(Optional.empty());
		when(units.existsBySchemeAndParentIdAndSlugAndIdNot("pre_2025", 79, "quan-3", 760)).thenReturn(true);

		assertThatThrownBy(() -> service().update(760, new AdminUnitUpdateRequest("Q", "quan-3", null, null)))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().update(1, new AdminUnitUpdateRequest("Q", "quan-3", null, null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		verify(units, never()).saveAndFlush(any());
	}

	@Test
	void deleteRemovesAFreeUnit() {
		AdminUnit existing = unit(760, 79, 2, "pre_2025", "quan-1");
		when(units.findById(760)).thenReturn(Optional.of(existing));

		service().delete(760);

		verify(units).delete(existing);
	}

	@Test
	void deleteRefusesUnitsWithChildrenOrReferencesAndUnknownUnits() {
		when(units.findById(79)).thenReturn(Optional.of(unit(79, null, 1, "pre_2025", "ho-chi-minh")));
		when(units.findById(760)).thenReturn(Optional.of(unit(760, 79, 2, "pre_2025", "quan-1")));
		when(units.findById(1)).thenReturn(Optional.empty());
		when(units.existsByParentId(79)).thenReturn(true);
		when(units.isReferenced(760)).thenReturn(true);

		for (int id : new int[] { 79, 760 }) {
			assertThatThrownBy(() -> service().delete(id))
					.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		}
		assertThatThrownBy(() -> service().delete(1)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));

		verify(units, never()).delete(any(AdminUnit.class));
	}

	@Test
	void getKnowsUnknownUnits() {
		when(units.findById(1)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().get(1)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void listIgnoresBlankFiltersAndReturnsThePage() {
		AdminUnit province = unit(79, null, 1, "pre_2025", "ho-chi-minh");
		when(units.search(any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(province), PageRequest.of(1, 10), 11));

		PageResponse<AdminUnitResponse> page = service().list(" ", (short) 1, null, "  ", 1, 10);

		verify(units).search(eq(null), eq((short) 1), eq(null), eq(null), eq(PageRequest.of(1, 10)));
		assertThat(page.items()).extracting(AdminUnitResponse::id).containsExactly(79);
		assertThat(page.total()).isEqualTo(11);
	}

}
