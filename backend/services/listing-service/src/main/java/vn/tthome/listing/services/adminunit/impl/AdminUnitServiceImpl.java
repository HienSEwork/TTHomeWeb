package vn.tthome.listing.services.adminunit.impl;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.models.dtos.AdminUnitCreateRequest;
import vn.tthome.listing.models.dtos.AdminUnitResponse;
import vn.tthome.listing.models.dtos.AdminUnitUpdateRequest;
import vn.tthome.listing.models.entities.AdminUnit;
import vn.tthome.listing.repos.adminunit.AdminUnitRepository;
import vn.tthome.listing.services.adminunit.AdminUnitService;

@Service
public class AdminUnitServiceImpl implements AdminUnitService {

	private final AdminUnitRepository units;

	public AdminUnitServiceImpl(AdminUnitRepository units) {
		this.units = units;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<AdminUnitResponse> list(String scheme, Short level, Integer parentId, String text, int page,
			int size) {
		return PageResponse.of(units.search(blankToNull(scheme), level, parentId, blankToNull(text),
				PageRequest.of(page, size)), AdminUnitResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public AdminUnitResponse get(int id) {
		return AdminUnitResponse.from(find(id));
	}

	@Override
	@Transactional
	public AdminUnitResponse create(AdminUnitCreateRequest request) {
		if (units.existsById(request.id())) {
			throw conflict("The id is already used");
		}
		checkParent(request);
		if (units.existsBySchemeAndParentIdAndSlug(request.scheme(), request.parentId(), request.slug())) {
			throw conflict("The slug is already used under the same parent");
		}
		AdminUnit unit = new AdminUnit();
		unit.setId(request.id());
		unit.setParentId(request.parentId());
		unit.setLevel(request.level());
		unit.setScheme(request.scheme());
		apply(unit, request.name(), request.slug(), request.centerLat(), request.centerLng());
		return AdminUnitResponse.from(units.saveAndFlush(unit));
	}

	@Override
	@Transactional
	public AdminUnitResponse update(int id, AdminUnitUpdateRequest request) {
		AdminUnit unit = find(id);
		if (units.existsBySchemeAndParentIdAndSlugAndIdNot(unit.getScheme(), unit.getParentId(), request.slug(), id)) {
			throw conflict("The slug is already used under the same parent");
		}
		apply(unit, request.name(), request.slug(), request.centerLat(), request.centerLng());
		return AdminUnitResponse.from(units.saveAndFlush(unit));
	}

	@Override
	@Transactional
	public void delete(int id) {
		AdminUnit unit = find(id);
		if (units.existsByParentId(id)) {
			throw conflict("The unit still has children");
		}
		if (units.isReferenced(id)) {
			throw conflict("The unit is used by a project, a mapping or the area statistics");
		}
		units.delete(unit);
		units.flush();
	}

	private AdminUnit find(int id) {
		return units.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Administrative unit not found"));
	}

	private void checkParent(AdminUnitCreateRequest request) {
		if (request.level() == 1) {
			if (request.parentId() != null) {
				throw invalid("A province has no parent");
			}
			return;
		}
		if (request.parentId() == null) {
			throw invalid("A district or ward needs a parent");
		}
		AdminUnit parent = units.findById(request.parentId()).orElseThrow(() -> invalid("Unknown parent"));
		if (parent.getLevel() != request.level() - 1 || !parent.getScheme().equals(request.scheme())) {
			throw invalid("The parent must be one level up in the same scheme");
		}
	}

	private static void apply(AdminUnit unit, String name, String slug, Double centerLat, Double centerLng) {
		unit.setName(name.strip());
		unit.setSlug(slug);
		unit.setCenterLat(centerLat);
		unit.setCenterLng(centerLng);
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
