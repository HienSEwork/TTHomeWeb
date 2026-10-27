package vn.tthome.listing.services.project.impl;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;
import vn.tthome.listing.commons.Slugs;
import vn.tthome.listing.models.dtos.ProjectRequest;
import vn.tthome.listing.models.dtos.ProjectResponse;
import vn.tthome.listing.models.dtos.SetAmenitiesRequest;
import vn.tthome.listing.models.entities.Amenity;
import vn.tthome.listing.models.entities.Project;
import vn.tthome.listing.repos.adminunit.AdminUnitRepository;
import vn.tthome.listing.repos.amenity.AmenityRepository;
import vn.tthome.listing.repos.project.ProjectRepository;
import vn.tthome.listing.services.project.ProjectService;

@Service
public class ProjectServiceImpl implements ProjectService {

	private static final String CODE_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
	private static final SecureRandom RANDOM = new SecureRandom();

	private final ProjectRepository projects;
	private final AdminUnitRepository units;
	private final AmenityRepository amenities;

	public ProjectServiceImpl(ProjectRepository projects, AdminUnitRepository units, AmenityRepository amenities) {
		this.projects = projects;
		this.units = units;
		this.amenities = amenities;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<ProjectResponse> list(String text, String status, Integer wardId, Integer districtId, int page,
			int size) {
		return PageResponse.of(projects.search(blankToNull(text), blankToNull(status), wardId, districtId,
				PageRequest.of(page, size)), ProjectResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public ProjectResponse get(UUID id) {
		return ProjectResponse.from(find(id));
	}

	@Override
	@Transactional
	public ProjectResponse create(ProjectRequest request) {
		checkAreas(request);
		Project project = new Project();
		project.setId(UUID.randomUUID());
		project.setCode(newCode());
		project.setSlug(uniqueSlug(request.name()));
		apply(project, request);
		return ProjectResponse.from(projects.saveAndFlush(project));
	}

	@Override
	@Transactional
	public ProjectResponse update(UUID id, ProjectRequest request) {
		Project project = find(id);
		checkAreas(request);
		if (!project.getName().equals(request.name().strip())) {
			project.setSlug(uniqueSlug(request.name()));
		}
		apply(project, request);
		return ProjectResponse.from(projects.saveAndFlush(project));
	}

	@Override
	@Transactional
	public ProjectResponse setStatus(UUID id, String status) {
		Project project = find(id);
		project.setStatus(status);
		return ProjectResponse.from(projects.saveAndFlush(project));
	}

	@Override
	@Transactional
	public ProjectResponse setAmenities(UUID id, SetAmenitiesRequest request) {
		Project project = find(id);
		Set<Short> wanted = new HashSet<>(request.amenityIds());
		Map<Short, Amenity> known = amenities.findAllById(wanted).stream()
				.collect(Collectors.toMap(Amenity::getId, Function.identity()));
		if (!known.keySet().containsAll(wanted)) {
			throw invalid("Unknown amenity");
		}
		if (known.values().stream().anyMatch(a -> a.getScope().equals("room"))) {
			throw invalid("A room-only amenity cannot be set on a project");
		}
		project.setAmenities(new HashSet<>(known.values()));
		return ProjectResponse.from(projects.saveAndFlush(project));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Project project = find(id);
		if (projects.hasRooms(id)) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The project still has rooms");
		}
		project.setDeletedAt(Instant.now());
		projects.saveAndFlush(project);
	}

	private Project find(UUID id) {
		return projects.findByIdAndDeletedAtIsNull(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Project not found"));
	}

	/** The old ward and the district belong to the pre-2025 scheme, the new ward to the post-2025 one. */
	private void checkAreas(ProjectRequest request) {
		checkUnit(request.wardId(), 3, "pre_2025", "Unknown ward");
		checkUnit(request.wardNewId(), 3, "post_2025", "Unknown new ward");
		checkUnit(request.districtId(), 2, "pre_2025", "Unknown district");
	}

	private void checkUnit(Integer id, int level, String scheme, String message) {
		if (id != null && !units.existsByIdAndLevelAndScheme(id, (short) level, scheme)) {
			throw invalid(message);
		}
	}

	private String uniqueSlug(String name) {
		String base = Slugs.of(name);
		if (base.isEmpty()) {
			base = "project";
		}
		String slug = base;
		for (int n = 2; projects.existsBySlugAndDeletedAtIsNull(slug); n++) {
			slug = base + "-" + n;
		}
		return slug;
	}

	private static String newCode() {
		StringBuilder code = new StringBuilder("PRJ-");
		for (int i = 0; i < 20; i++) {
			code.append(CODE_ALPHABET.charAt(RANDOM.nextInt(CODE_ALPHABET.length())));
		}
		return code.toString();
	}

	private static void apply(Project project, ProjectRequest r) {
		project.setName(r.name().strip());
		project.setStreetAddress(r.streetAddress());
		project.setWardId(r.wardId());
		project.setWardNewId(r.wardNewId());
		project.setDistrictId(r.districtId());
		project.setLat(r.lat());
		project.setLng(r.lng());
		project.setOwnerUserId(r.ownerUserId());
		project.setManagerUserId(r.managerUserId());
		project.setExclusive(r.exclusive());
		project.setPetPolicy(r.petPolicy());
		project.setEvParking(r.evParking());
		project.setFreeHours(r.freeHours());
		project.setMaxGuestsNote(r.maxGuestsNote());
		project.setHouseRules(r.houseRules());
		project.setFeeElectric(dong(r.feeElectric()));
		project.setFeeWater(dong(r.feeWater()));
		project.setFeeService(dong(r.feeService()));
		project.setFeeParking(dong(r.feeParking()));
		project.setFeeNote(r.feeNote());
		project.setDescription(r.description());
	}

	private static BigDecimal dong(Long amount) {
		return amount == null ? null : BigDecimal.valueOf(amount);
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static String blankToNull(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
