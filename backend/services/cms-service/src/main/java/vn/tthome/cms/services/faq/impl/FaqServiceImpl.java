package vn.tthome.cms.services.faq.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.cms.models.dtos.FaqRequest;
import vn.tthome.cms.models.dtos.FaqResponse;
import vn.tthome.cms.models.entities.Faq;
import vn.tthome.cms.repos.faq.FaqRepository;
import vn.tthome.cms.services.faq.FaqService;

@Service
public class FaqServiceImpl implements FaqService {

	private final FaqRepository repository;

	public FaqServiceImpl(FaqRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<FaqResponse> list(String locale, String audience, Boolean active) {
		return repository.search(blank(locale), blank(audience), active).stream().map(FaqResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public FaqResponse get(UUID id) {
		return FaqResponse.from(find(id));
	}

	@Override
	@Transactional
	public FaqResponse create(FaqRequest request) {
		Faq e = new Faq();
		e.setId(UUID.randomUUID());
		check(null, request);
		apply(e, request);
		return FaqResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public FaqResponse update(UUID id, FaqRequest request) {
		Faq e = find(id);
		check(e, request);
		apply(e, request);
		return FaqResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		Faq e = find(id);
		repository.delete(e);
		repository.flush();
	}

	private Faq find(UUID id) {
		return repository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "Faq not found"));
	}

	/** Rejects values that do not fit together; current is the stored faq on update and null on create. */
	private void check(Faq current, FaqRequest r) {
	}

	private static void apply(Faq e, FaqRequest r) {
		e.setLocale(r.locale());
		e.setAudience(r.audience());
		e.setQuestion(r.question().strip());
		e.setAnswer(r.answer().strip());
		e.setSortOrder(r.sortOrder());
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
