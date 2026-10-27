package vn.tthome.cms.controllers;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import jakarta.validation.Valid;
import vn.tthome.cms.models.dtos.FaqRequest;
import vn.tthome.cms.models.dtos.FaqResponse;
import vn.tthome.cms.services.faq.FaqService;

@RestController
@RequestMapping("/api/v1/admin/cms/faqs")
@PreAuthorize("hasRole('ADMIN')")
public class FaqController {

	private final FaqService faqs;

	public FaqController(FaqService faqs) {
		this.faqs = faqs;
	}

	@GetMapping
	public List<FaqResponse> list(@RequestParam(required = false) String locale, @RequestParam(required = false) String audience, @RequestParam(required = false) Boolean active) {
		return faqs.list(locale, audience, active);
	}

	@GetMapping("/{id}")
	public FaqResponse get(@PathVariable UUID id) {
		return faqs.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public FaqResponse create(@Valid @RequestBody FaqRequest body) {
		return faqs.create(body);
	}

	@PutMapping("/{id}")
	public FaqResponse update(@PathVariable UUID id, @Valid @RequestBody FaqRequest body) {
		return faqs.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		faqs.delete(id);
	}

}
