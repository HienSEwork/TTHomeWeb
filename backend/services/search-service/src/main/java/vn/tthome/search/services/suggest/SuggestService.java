package vn.tthome.search.services.suggest;

import java.util.List;

import vn.tthome.search.models.dtos.SuggestItemResponse;

public interface SuggestService {

	int LIMIT = 8;

	/** Project suggestions for what the user has typed so far; empty for a blank query. */
	List<SuggestItemResponse> suggest(String q);

}
