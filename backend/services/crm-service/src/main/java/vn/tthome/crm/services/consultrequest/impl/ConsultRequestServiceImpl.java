package vn.tthome.crm.services.consultrequest.impl;

import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.crm.models.dtos.ConsultRequestResponse;
import vn.tthome.crm.models.entities.ConsultRequest;
import vn.tthome.crm.repos.consultrequest.ConsultRequestRepository;
import vn.tthome.crm.services.consultrequest.ConsultRequestService;
import vn.tthome.common.error.ApiException;
import vn.tthome.common.web.PageResponse;

@Service
public class ConsultRequestServiceImpl implements ConsultRequestService {

	private static final Map<String, Set<String>> MOVES = Map.of(
			"new", Set.of("spam"),
			"assigned", Set.of("contacted", "done", "spam"),
			"contacted", Set.of("done", "spam"));

	private final ConsultRequestRepository requests;

	public ConsultRequestServiceImpl(ConsultRequestRepository requests) {
		this.requests = requests;
	}

	@Override
	@Transactional(readOnly = true)
	public PageResponse<ConsultRequestResponse> list(String status, UUID assignedTo, String text, int page, int size) {
		return PageResponse.of(requests.search(blank(status), assignedTo, blank(text), PageRequest.of(page, size)),
				ConsultRequestResponse::from);
	}

	@Override
	@Transactional(readOnly = true)
	public ConsultRequestResponse get(UUID id) {
		return ConsultRequestResponse.from(find(id));
	}

	@Override
	@Transactional
	public ConsultRequestResponse assign(UUID id, UUID staffId) {
		ConsultRequest request = find(id);
		String status = request.getStatus();
		if (status.equals("done") || status.equals("spam")) {
			throw conflict("The request is " + status);
		}
		if (staffId == null) {
			if (status.equals("contacted")) {
				throw conflict("A request that is being worked on keeps its assignee");
			}
			request.setStatus("new");
		} else if (status.equals("new")) {
			request.setStatus("assigned");
		}
		request.setAssignedTo(staffId);
		return ConsultRequestResponse.from(requests.saveAndFlush(request));
	}

	@Override
	@Transactional
	public ConsultRequestResponse setStatus(UUID id, String status) {
		ConsultRequest request = find(id);
		if (!MOVES.getOrDefault(request.getStatus(), Set.of()).contains(status)) {
			throw conflict("A request that is " + request.getStatus() + " cannot become " + status);
		}
		request.setStatus(status);
		return ConsultRequestResponse.from(requests.saveAndFlush(request));
	}

	private ConsultRequest find(UUID id) {
		return requests.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Consultation request not found"));
	}

	private static ApiException conflict(String message) {
		return new ApiException(HttpStatus.CONFLICT, "CONFLICT", message);
	}

	private static String blank(String value) {
		return value == null || value.isBlank() ? null : value.strip();
	}

}
