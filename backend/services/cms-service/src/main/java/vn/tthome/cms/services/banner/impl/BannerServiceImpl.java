package vn.tthome.cms.services.banner.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.cms.models.dtos.BannerRequest;
import vn.tthome.cms.models.dtos.BannerResponse;
import vn.tthome.cms.models.entities.Banner;
import vn.tthome.cms.repos.banner.BannerRepository;
import vn.tthome.cms.services.banner.BannerService;

@Service
public class BannerServiceImpl implements BannerService {

	private final BannerRepository repository;

	public BannerServiceImpl(BannerRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<BannerResponse> list(String locale, String placement, Boolean active) {
		return repository.search(blank(locale), blank(placement), active).stream().map(BannerResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public BannerResponse get(UUID id) {
		return BannerResponse.from(find(id));
	}

	@Override
	@Transactional
	public BannerResponse create(BannerRequest request) {
		Banner e = new Banner();
		e.setId(UUID.randomUUID());
		check(null, request);
		apply(e, request);
		return BannerResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public BannerResponse update(UUID id, BannerRequest request) {
		Banner e = find(id);
		check(e, request);
		apply(e, request);
		return BannerResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Banner e = find(id);
		repository.delete(e);
		repository.flush();
	}

	private Banner find(UUID id) {
		return repository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Banner not found"));
	}

	/** Rejects values that do not fit together; current is the stored banner on update and null on create. */
	private void check(Banner current, BannerRequest r) {
		if (r.startsAt() != null && r.endsAt() != null && !r.endsAt().isAfter(r.startsAt())) {
			throw invalid("The end must be after the start");
		}
	}

	private static void apply(Banner e, BannerRequest r) {
		e.setLocale(r.locale());
		e.setPlacement(r.placement().strip());
		e.setTitle(strip(r.title()));
		e.setImageUrl(r.imageUrl().strip());
		e.setMobileImageUrl(r.mobileImageUrl());
		e.setLinkUrl(r.linkUrl());
		e.setSortOrder(r.sortOrder());
		e.setStartsAt(r.startsAt());
		e.setEndsAt(r.endsAt());
		e.setActive(!Boolean.FALSE.equals(r.active()));
	}

	private static ApiException invalid(String message) {
		return new ApiException(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message);
	}

	private static String strip(String value) {
		return value == null ? null : value.strip();
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
