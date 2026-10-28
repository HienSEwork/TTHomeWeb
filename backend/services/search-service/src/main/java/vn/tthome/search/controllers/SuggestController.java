package vn.tthome.search.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import vn.tthome.search.models.dtos.SuggestItemResponse;
import vn.tthome.search.services.suggest.SuggestService;

@RestController
@RequestMapping("/api/v1/suggest")
@Tag(name = "Suggest")
public class SuggestController {

	private final SuggestService suggest;

	public SuggestController(SuggestService suggest) {
		this.suggest = suggest;
	}

	@GetMapping
	@Operation(summary = "Project suggestions while the user types in the search box")
	public List<SuggestItemResponse> suggest(@RequestParam(required = false) String q) {
		return suggest.suggest(q);
	}

}
