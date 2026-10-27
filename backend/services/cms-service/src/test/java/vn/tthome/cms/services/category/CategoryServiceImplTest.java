package vn.tthome.cms.services.category;

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
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.cms.models.dtos.CategoryRequest;
import vn.tthome.cms.models.entities.Category;
import vn.tthome.cms.repos.category.CategoryRepository;
import vn.tthome.cms.services.category.impl.CategoryServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class CategoryServiceImplTest {

	@Mock
	CategoryRepository repository;

	private CategoryServiceImpl service() {
		return new CategoryServiceImpl(repository);
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	private static Category existing(String locale, UUID parent) {
		Category category = new Category();
		category.setId(UUID.randomUUID());
		category.setLocale(locale);
		category.setParentId(parent);
		category.setName("C");
		category.setSlug("c-" + category.getId().toString().substring(0, 8));
		return category;
	}

	private static CategoryRequest request(String locale, UUID parent, String slug) {
		return new CategoryRequest(locale, parent, " News ", slug, (short) 1);
	}

	@Test
	void createUnderAParentOfTheSameLanguage() {
		Category parent = existing("vi", null);
		when(repository.findById(parent.getId())).thenReturn(Optional.of(parent));
		when(repository.saveAndFlush(any(Category.class))).thenAnswer(call -> call.getArgument(0));

		var response = service().create(request("vi", parent.getId(), "news"));

		assertThat(response.parentId()).isEqualTo(parent.getId());
		assertThat(response.name()).isEqualTo("News");
	}

	@Test
	void theParentMustExistAndShareTheLanguage() {
		Category otherLanguage = existing("en", null);
		UUID unknown = UUID.randomUUID();
		when(repository.findById(otherLanguage.getId())).thenReturn(Optional.of(otherLanguage));
		when(repository.findById(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().create(request("vi", otherLanguage.getId(), "a")))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().create(request("vi", unknown, "b")))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void aCategoryCannotSitUnderItselfOrOneOfItsDescendants() {
		Category top = existing("vi", null);
		Category middle = existing("vi", top.getId());
		Category leaf = existing("vi", middle.getId());
		when(repository.findById(top.getId())).thenReturn(Optional.of(top));
		when(repository.findById(middle.getId())).thenReturn(Optional.of(middle));
		when(repository.findById(leaf.getId())).thenReturn(Optional.of(leaf));

		for (UUID newParent : List.of(top.getId(), middle.getId(), leaf.getId())) {
			assertThatThrownBy(() -> service().update(top.getId(), request("vi", newParent, "x")))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void moveALeafUnderAnotherBranch() {
		Category a = existing("vi", null);
		Category b = existing("vi", null);
		Category leaf = existing("vi", a.getId());
		when(repository.findById(leaf.getId())).thenReturn(Optional.of(leaf));
		when(repository.findById(b.getId())).thenReturn(Optional.of(b));
		when(repository.saveAndFlush(leaf)).thenReturn(leaf);

		assertThat(service().update(leaf.getId(), request("vi", b.getId(), "moved")).parentId()).isEqualTo(b.getId());
	}

	@Test
	void theSlugIsUniquePerLanguage() {
		when(repository.existsByLocaleAndSlug("vi", "taken")).thenReturn(true);

		assertThatThrownBy(() -> service().create(request("vi", null, "taken")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
	}

	@Test
	void aCategoryWithChildrenOrPostsCannotBeDeleted() {
		Category category = existing("vi", null);
		when(repository.findById(category.getId())).thenReturn(Optional.of(category));
		when(repository.existsByParentId(category.getId())).thenReturn(true, false, false);
		when(repository.usedByPosts(category.getId())).thenReturn(true, false);

		assertThatThrownBy(() -> service().delete(category.getId()))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThatThrownBy(() -> service().delete(category.getId()))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		service().delete(category.getId());

		verify(repository).delete(category);
	}

}
