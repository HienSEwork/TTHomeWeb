package vn.tthome.listing.services.amenity.impl;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.listing.models.dtos.AmenityRequest;
import vn.tthome.listing.models.dtos.AmenityResponse;
import vn.tthome.listing.models.entities.Amenity;
import vn.tthome.listing.repos.amenity.AmenityRepository;
import vn.tthome.listing.services.amenity.AmenityService;

@Service
public class AmenityServiceImpl implements AmenityService {

	private final AmenityRepository repository;

	public AmenityServiceImpl(AmenityRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<AmenityResponse> list() {
		return repository.findAll(Sort.by("sortOrder", "id")).stream().map(AmenityResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public AmenityResponse get(short id) {
		return AmenityResponse.from(find(id));
	}

	@Override
	@Transactional
	public AmenityResponse create(AmenityRequest request) {
		if (repository.existsByCode(request.code())) {
			throw conflict("The code is already used");
		}
		Amenity entity = new Amenity();
		entity.setId(repository.nextId());
		apply(entity, request);
		return AmenityResponse.from(repository.saveAndFlush(entity));
	}

	@Override
	@Transactional
	public AmenityResponse update(short id, AmenityRequest request) {
		Amenity entity = find(id);
		if (repository.existsByCodeAndIdNot(request.code(), id)) {
			throw conflict("The code is already used");
		}
		apply(entity, request);
		return AmenityResponse.from(repository.saveAndFlush(entity));
	}

	@Override
	@Transactional
	public void delete(short id) {
		Amenity entity = find(id);
		if (repository.isUsed(id)) {
			throw conflict("The amenity is used by a project or a room");
		}
		repository.delete(entity);
		repository.flush();
	}

	private Amenity find(short id) {
		return repository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Amenity not found"));
	}

	private static void apply(Amenity entity, AmenityRequest request) {
		entity.setCode(request.code());
		entity.setName(request.name().strip());
		entity.setScope(request.scope());
		entity.setIcon(request.icon());
		entity.setSortOrder(request.sortOrder());
		entity.setFilter(request.filter());
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

}
