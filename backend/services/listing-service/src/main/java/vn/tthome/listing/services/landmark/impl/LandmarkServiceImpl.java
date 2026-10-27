package vn.tthome.listing.services.landmark.impl;

import java.util.List;

import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.listing.models.dtos.LandmarkRequest;
import vn.tthome.listing.models.dtos.LandmarkResponse;
import vn.tthome.listing.models.entities.Landmark;
import vn.tthome.listing.repos.landmark.LandmarkRepository;
import vn.tthome.listing.services.landmark.LandmarkService;

@Service
public class LandmarkServiceImpl implements LandmarkService {

	private final LandmarkRepository repository;

	public LandmarkServiceImpl(LandmarkRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<LandmarkResponse> list() {
		return repository.findAll(Sort.by("sortOrder", "id")).stream().map(LandmarkResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public LandmarkResponse get(short id) {
		return LandmarkResponse.from(find(id));
	}

	@Override
	@Transactional
	public LandmarkResponse create(LandmarkRequest request) {
		if (repository.existsByCode(request.code())) {
			throw conflict("The code is already used");
		}
		Landmark entity = new Landmark();
		entity.setId(repository.nextId());
		apply(entity, request);
		return LandmarkResponse.from(repository.saveAndFlush(entity));
	}

	@Override
	@Transactional
	public LandmarkResponse update(short id, LandmarkRequest request) {
		Landmark entity = find(id);
		if (repository.existsByCodeAndIdNot(request.code(), id)) {
			throw conflict("The code is already used");
		}
		apply(entity, request);
		return LandmarkResponse.from(repository.saveAndFlush(entity));
	}

	@Override
	@Transactional
	public void delete(short id) {
		Landmark entity = find(id);
		repository.delete(entity);
		repository.flush();
	}

	private Landmark find(short id) {
		return repository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Landmark not found"));
	}

	private static void apply(Landmark entity, LandmarkRequest request) {
		entity.setCode(request.code());
		entity.setName(request.name().strip());
		entity.setKind(request.kind());
		entity.setLat(request.lat());
		entity.setLng(request.lng());
		entity.setRadiusM(request.radiusM());
		entity.setSortOrder(request.sortOrder());
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

}
