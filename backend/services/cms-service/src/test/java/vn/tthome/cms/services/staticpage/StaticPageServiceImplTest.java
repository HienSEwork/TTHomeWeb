package vn.tthome.cms.services.staticpage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.cms.models.dtos.StaticPageRequest;
import vn.tthome.cms.models.dtos.StaticPageResponse;
import vn.tthome.cms.models.entities.StaticPage;
import vn.tthome.cms.repos.staticpage.StaticPageRepository;
import vn.tthome.cms.services.htmlsanitizer.HtmlSanitizer;
import vn.tthome.cms.services.staticpage.impl.StaticPageServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class StaticPageServiceImplTest {

	@Mock
	StaticPageRepository pages;
	@Mock
	HtmlSanitizer sanitizer;

	private StaticPageServiceImpl service() {
		return new StaticPageServiceImpl(pages, sanitizer);
	}

	private static StaticPageRequest request(String locale, UUID group, String slug) {
		return new StaticPageRequest(locale, group, slug, " About us ", "<p>raw</p>", "published");
	}

	private static StaticPage existing(String locale) {
		StaticPage page = new StaticPage();
		page.setId(UUID.randomUUID());
		page.setTranslationGroupId(UUID.randomUUID());
		page.setLocale(locale);
		page.setSlug("about");
		page.setTitle("Old");
		return page;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createStoresTheSanitizedContentUnderANewTranslationGroup() {
		when(sanitizer.clean("<p>raw</p>")).thenReturn("<p>clean</p>");
		when(pages.saveAndFlush(any(StaticPage.class))).thenAnswer(call -> call.getArgument(0));

		StaticPageResponse response = service().create(request("vi", null, "ve-chung-toi"));

		ArgumentCaptor<StaticPage> saved = ArgumentCaptor.forClass(StaticPage.class);
		verify(pages).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getTranslationGroupId()).isNotNull();
		assertThat(response.content()).isEqualTo("<p>clean</p>");
		assertThat(response.title()).isEqualTo("About us");
		assertThat(response.slug()).isEqualTo("ve-chung-toi");
	}

	@Test
	void createAddsATranslationToAnExistingGroup() {
		UUID group = UUID.randomUUID();
		when(pages.saveAndFlush(any(StaticPage.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(request("en", group, "about-us")).translationGroupId()).isEqualTo(group);
	}

	@Test
	void createRefusesATakenSlugAndAGroupThatAlreadyHasTheLanguage() {
		UUID group = UUID.randomUUID();
		when(pages.existsByLocaleAndSlug("vi", "taken")).thenReturn(true);
		when(pages.existsByTranslationGroupIdAndLocale(group, "vi")).thenReturn(true);

		assertThatThrownBy(() -> service().create(request("vi", null, "taken")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().create(request("vi", group, "free")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		verify(pages, never()).saveAndFlush(any());
	}

	@Test
	void updateKeepsTheLanguageAndGroupAndRefusesTheSlugOfAnotherPage() {
		StaticPage page = existing("vi");
		when(pages.findById(page.getId())).thenReturn(Optional.of(page));
		when(pages.existsByLocaleAndSlugAndIdNot("vi", "taken", page.getId())).thenReturn(true);
		when(pages.existsByLocaleAndSlugAndIdNot("vi", "new-slug", page.getId())).thenReturn(false);
		when(pages.saveAndFlush(page)).thenReturn(page);

		assertThat(service().update(page.getId(), request("vi", page.getTranslationGroupId(), "new-slug")).slug())
				.isEqualTo("new-slug");
		assertThatThrownBy(() -> service().update(page.getId(), request("vi", null, "taken")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
	}

	@Test
	void updateRefusesToChangeTheLanguageOrTheGroup() {
		StaticPage page = existing("vi");
		when(pages.findById(page.getId())).thenReturn(Optional.of(page));

		assertThatThrownBy(() -> service().update(page.getId(), request("en", null, "about")))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().update(page.getId(), request("vi", UUID.randomUUID(), "about")))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		verify(pages, never()).saveAndFlush(any());
	}

	@Test
	void getUpdateAndDeleteKnowUnknownPages() {
		UUID unknown = UUID.randomUUID();
		when(pages.findById(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().update(unknown, request("vi", null, "x")))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void deleteRemovesThePageAndListIgnoresBlankFilters() {
		StaticPage page = existing("vi");
		when(pages.findById(page.getId())).thenReturn(Optional.of(page));
		when(pages.search(any(), any())).thenReturn(List.of(page));

		service().delete(page.getId());
		assertThat(service().list(" ", "")).hasSize(1);

		verify(pages).delete(page);
		verify(pages).search(null, null);
	}

}
