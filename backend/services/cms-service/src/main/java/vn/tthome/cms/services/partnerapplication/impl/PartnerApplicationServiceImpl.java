package vn.tthome.cms.services.partnerapplication.impl;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.cms.models.dtos.PartnerApplicationResponse;
import vn.tthome.cms.models.entities.PartnerApplication;
import vn.tthome.cms.repos.partnerapplication.PartnerApplicationRepository;
import vn.tthome.cms.services.partnerapplication.PartnerApplicationService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class PartnerApplicationServiceImpl implements PartnerApplicationService {

	private static final Map<String, Set<String>> MOVES = Map.of(
			"new", Set.of("contacted", "approved", "rejected"),
			"contacted", Set.of("approved", "rejected"));

	private final PartnerApplicationRepository applications;

	public PartnerApplicationServiceImpl(PartnerApplicationRepository applications) {
		this.applications = applications;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<PartnerApplicationResponse> list(String kind, String status, String text, int page, int size) {
		return PageResponse.of(applications.search(blank(kind), blank(status), blank(text), PageRequest.of(page, size)),
				PartnerApplicationResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public PartnerApplicationResponse get(UUID id) {
		return PartnerApplicationResponse.from(find(id));
	}

	@Override
	@Transactional
	public PartnerApplicationResponse setStatus(UUID id, String status) {
		PartnerApplication application = find(id);
		if (!MOVES.getOrDefault(application.getStatus(), Set.of()).contains(status)) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT",
					"An application that is " + application.getStatus() + " cannot become " + status);
		}
		application.setStatus(status);
		applications.saveAndFlush(application);
		return PartnerApplicationResponse.from(application);
	}

	private PartnerApplication find(UUID id) {
		return applications.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Application not found"));
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
