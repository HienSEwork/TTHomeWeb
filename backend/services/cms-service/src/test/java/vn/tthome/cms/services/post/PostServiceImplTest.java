package vn.tthome.cms.services.post;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;

import vn.tthome.cms.models.dtos.PostRequest;
import vn.tthome.cms.models.dtos.PostResponse;
import vn.tthome.cms.models.entities.Category;
import vn.tthome.cms.models.entities.Post;
import vn.tthome.cms.models.entities.Tag;
import vn.tthome.cms.repos.category.CategoryRepository;
import vn.tthome.cms.repos.post.PostRepository;
import vn.tthome.cms.repos.tag.TagRepository;
import vn.tthome.cms.services.htmlsanitizer.HtmlSanitizer;
import vn.tthome.cms.services.post.impl.PostServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class PostServiceImplTest {

	private static final Instant NOW = Instant.parse("2026-06-01T10:00:00Z");

	@Mock
	PostRepository posts;
	@Mock
	CategoryRepository categories;
	@Mock
	TagRepository tags;
	@Mock
	HtmlSanitizer sanitizer;

	private PostServiceImpl service() {
		return new PostServiceImpl(posts, categories, tags, sanitizer, Clock.fixed(NOW, ZoneOffset.UTC));
	}

	private static PostRequest request(String title, String slug, String status, Instant publishedAt) {
		return new PostRequest("vi", null, null, " Writer ", title, slug, " Short ", "<p>Hello</p>", null, status, publishedAt,
				List.of());
	}

	private static Post existing(String status) {
		Post post = new Post();
		post.setId(UUID.randomUUID());
		post.setTranslationGroupId(UUID.randomUUID());
		post.setLocale("vi");
		post.setTitle("Old");
		post.setSlug("old");
		post.setContent("old");
		post.setStatus(status);
		return post;
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createSanitizesComputesTheReadingTimeAndMakesASlugFromTheTitle() {
		UUID author = UUID.randomUUID();
		when(sanitizer.clean("<p>Hello</p>")).thenReturn("<p>Hello</p>");
		when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));

		PostResponse response = service().create(author, request(" Nhà trọ ", null, "draft", null));

		ArgumentCaptor<Post> saved = ArgumentCaptor.forClass(Post.class);
		verify(posts).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getAuthorId()).isEqualTo(author);
		assertThat(saved.getValue().getTranslationGroupId()).isNotNull();
		assertThat(response.slug()).isEqualTo("nha-tro");
		assertThat(response.title()).isEqualTo("Nhà trọ");
		assertThat(response.authorName()).isEqualTo("Writer");
		assertThat(response.excerpt()).isEqualTo("Short");
		assertThat(response.readMinutes()).isEqualTo((short) 1);
		assertThat(response.status()).isEqualTo("draft");
		assertThat(response.publishedAt()).isNull();
	}

	@Test
	void theStoredContentIsTheSanitizedOne() {
		when(sanitizer.clean("<p>Hello</p>")).thenReturn("<p>cleaned</p>");
		when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(UUID.randomUUID(), request("T", null, "draft", null)).content()).isEqualTo("<p>cleaned</p>");
	}

	@Test
	void aGeneratedSlugIsNumberedWhenTaken() {
		when(posts.existsByLocaleAndSlug("vi", "title")).thenReturn(true);
		when(posts.existsByLocaleAndSlug("vi", "title-2")).thenReturn(true);
		when(sanitizer.clean(any())).thenReturn("x");
		when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(UUID.randomUUID(), request("Title", null, "draft", null)).slug()).isEqualTo("title-3");
	}

	@Test
	void aGivenSlugMustBeFreeInThatLanguage() {
		when(posts.existsByLocaleAndSlug("vi", "taken")).thenReturn(true);

		assertThatThrownBy(() -> service().create(UUID.randomUUID(), request("T", "taken", "draft", null)))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		verify(posts, never()).saveAndFlush(any());
	}

	@Test
	void aTranslationGroupHoldsOnePostPerLanguage() {
		UUID group = UUID.randomUUID();
		when(posts.existsByTranslationGroupIdAndLocale(group, "vi")).thenReturn(true);
		PostRequest r = new PostRequest("vi", group, null, null, "T", null, null, "x", null, "draft", null, List.of());

		assertThatThrownBy(() -> service().create(UUID.randomUUID(), r))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
	}

	@Test
	void readingTimeFollowsTheWordsOfTheVisibleText() throws Exception {
		var method = Class.forName("vn.tthome.cms.services.post.impl.PostServiceImpl").getDeclaredMethod("readMinutes", String.class);
		method.setAccessible(true);

		assertThat((short) method.invoke(null, "")).isEqualTo((short) 1);
		assertThat((short) method.invoke(null, "<p>" + "word ".repeat(200) + "</p>")).isEqualTo((short) 1);
		assertThat((short) method.invoke(null, "<p>" + "word ".repeat(201) + "</p>")).isEqualTo((short) 2);
		assertThat((short) method.invoke(null, "<img src=\"x\"><br/>" + "a b ".repeat(450))).isEqualTo((short) 5);
	}

	@Test
	void aScheduledPostNeedsAFutureTime() {
		when(sanitizer.clean(any())).thenReturn("x");
		when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));

		for (Instant bad : new Instant[] { null, NOW, NOW.minusSeconds(1) }) {
			assertThatThrownBy(() -> service().create(UUID.randomUUID(), request("T", null, "scheduled", bad)))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		assertThat(service().create(UUID.randomUUID(), request("T", null, "scheduled", NOW.plusSeconds(60))).publishedAt())
				.isEqualTo(NOW.plusSeconds(60));
	}

	@Test
	void publishingSetsTheTimeToNowUnlessGiven() {
		when(sanitizer.clean(any())).thenReturn("x");
		when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(UUID.randomUUID(), request("T", null, "published", null)).publishedAt()).isEqualTo(NOW);
		Instant earlier = NOW.minusSeconds(3600);
		assertThat(service().create(UUID.randomUUID(), request("T", null, "published", earlier)).publishedAt()).isEqualTo(earlier);
	}

	@Test
	void anAlreadyPublishedPostKeepsItsTimeWhenUpdatedWithoutOne() {
		Post post = existing("published");
		post.setPublishedAt(NOW.minusSeconds(86400));
		when(posts.findByIdAndDeletedAtIsNull(post.getId())).thenReturn(Optional.of(post));
		when(sanitizer.clean(any())).thenReturn("x");
		when(posts.saveAndFlush(post)).thenReturn(post);
		PostRequest r = new PostRequest("vi", post.getTranslationGroupId(), null, null, "New", null, null, "x", null, "published",
				null, List.of());

		assertThat(service().update(post.getId(), r).publishedAt()).isEqualTo(NOW.minusSeconds(86400));
	}

	@Test
	void aDraftThatIsPublishedGetsTheCurrentTime() {
		Post post = existing("draft");
		when(posts.findByIdAndDeletedAtIsNull(post.getId())).thenReturn(Optional.of(post));
		when(posts.saveAndFlush(post)).thenReturn(post);

		PostResponse response = service().setStatus(post.getId(), "published", null);

		assertThat(response.status()).isEqualTo("published");
		assertThat(response.publishedAt()).isEqualTo(NOW);
	}

	@Test
	void archivingOrReturningToDraftKeepsThePublishingTime() {
		Post post = existing("published");
		post.setPublishedAt(NOW.minusSeconds(60));
		when(posts.findByIdAndDeletedAtIsNull(post.getId())).thenReturn(Optional.of(post));
		when(posts.saveAndFlush(post)).thenReturn(post);

		assertThat(service().setStatus(post.getId(), "archived", null).publishedAt()).isEqualTo(NOW.minusSeconds(60));
		assertThat(service().setStatus(post.getId(), "draft", null).status()).isEqualTo("draft");
	}

	@Test
	void updateKeepsTheLanguageGroupAndAuthor() {
		Post post = existing("draft");
		UUID author = UUID.randomUUID();
		post.setAuthorId(author);
		when(posts.findByIdAndDeletedAtIsNull(post.getId())).thenReturn(Optional.of(post));

		assertThatThrownBy(() -> service().update(post.getId(), new PostRequest("en", null, null, null, "T", null, null, "x", null,
				"draft", null, List.of()))).satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().update(post.getId(), new PostRequest("vi", UUID.randomUUID(), null, null, "T", null,
				null, "x", null, "draft", null, List.of()))).satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThat(post.getAuthorId()).isEqualTo(author);
		verify(posts, never()).saveAndFlush(any());
	}

	@Test
	void updateKeepsTheSlugUnlessANewOneIsGiven() {
		Post post = existing("draft");
		when(posts.findByIdAndDeletedAtIsNull(post.getId())).thenReturn(Optional.of(post));
		when(sanitizer.clean(any())).thenReturn("x");
		when(posts.existsByLocaleAndSlugAndIdNot("vi", "new-slug", post.getId())).thenReturn(false);
		when(posts.saveAndFlush(post)).thenReturn(post);

		assertThat(service().update(post.getId(), request("Another title", null, "draft", null)).slug()).isEqualTo("old");
		assertThat(service().update(post.getId(), request("Another title", "new-slug", "draft", null)).slug()).isEqualTo("new-slug");
	}

	@Test
	void theCategoryAndTagsMustExistAndShareTheLanguage() {
		Category otherLanguage = new Category();
		otherLanguage.setId(UUID.randomUUID());
		otherLanguage.setLocale("en");
		Tag englishTag = new Tag();
		englishTag.setId(UUID.randomUUID());
		englishTag.setLocale("en");
		UUID unknown = UUID.randomUUID();
		when(categories.findById(otherLanguage.getId())).thenReturn(Optional.of(otherLanguage));
		when(categories.findById(unknown)).thenReturn(Optional.empty());
		when(tags.findAllById(Set.of(englishTag.getId()))).thenReturn(List.of(englishTag));
		when(tags.findAllById(Set.of(unknown))).thenReturn(List.of());

		for (UUID category : List.of(otherLanguage.getId(), unknown)) {
			PostRequest r = new PostRequest("vi", null, category, null, "T", null, null, "x", null, "draft", null, List.of());
			assertThatThrownBy(() -> service().create(UUID.randomUUID(), r))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		for (UUID tag : List.of(englishTag.getId(), unknown)) {
			PostRequest r = new PostRequest("vi", null, null, null, "T", null, null, "x", null, "draft", null, List.of(tag));
			assertThatThrownBy(() -> service().create(UUID.randomUUID(), r))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		verify(posts, never()).saveAndFlush(any());
	}

	@Test
	void tagsAreStoredOnce() {
		Tag tag = new Tag();
		tag.setId(UUID.randomUUID());
		tag.setLocale("vi");
		when(tags.findAllById(Set.of(tag.getId()))).thenReturn(List.of(tag));
		when(sanitizer.clean(any())).thenReturn("x");
		when(posts.saveAndFlush(any(Post.class))).thenAnswer(call -> call.getArgument(0));

		PostResponse response = service().create(UUID.randomUUID(), new PostRequest("vi", null, null, null, "T", null, null, "x",
				null, "draft", null, List.of(tag.getId(), tag.getId())));

		assertThat(response.tagIds()).containsExactly(tag.getId());
	}

	@Test
	void deleteMarksThePostDeletedAndUnknownPostsAreNotFound() {
		Post post = existing("draft");
		UUID unknown = UUID.randomUUID();
		when(posts.findByIdAndDeletedAtIsNull(post.getId())).thenReturn(Optional.of(post));
		when(posts.findByIdAndDeletedAtIsNull(unknown)).thenReturn(Optional.empty());

		service().delete(post.getId());

		assertThat(post.getDeletedAt()).isEqualTo(NOW);
		verify(posts).saveAndFlush(post);
		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().setStatus(unknown, "draft", null))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
	}

	@Test
	void listIgnoresBlankFilters() {
		when(posts.search(any(), any(), any(), any(), any(Pageable.class)))
				.thenReturn(new PageImpl<>(List.of(existing("draft")), PageRequest.of(1, 5), 6));

		var page = service().list(" ", "", null, "  ", 1, 5);

		verify(posts).search(eq(null), eq(null), eq(null), eq(null), eq(PageRequest.of(1, 5)));
		assertThat(page.total()).isEqualTo(6);
	}

}
