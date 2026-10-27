package vn.tthome.cms.services.tag;

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

import vn.tthome.cms.models.dtos.TagRequest;
import vn.tthome.cms.models.entities.Tag;
import vn.tthome.cms.repos.tag.TagRepository;
import vn.tthome.cms.services.tag.impl.TagServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class TagServiceImplTest {

	@Mock
	TagRepository repository;

	private TagServiceImpl service() {
		return new TagServiceImpl(repository);
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	private static Tag existing(String slug) {
		Tag tag = new Tag();
		tag.setId(UUID.randomUUID());
		tag.setLocale("vi");
		tag.setName("Old");
		tag.setSlug(slug);
		return tag;
	}

	@Test
	void createSavesTheStrippedName() {
		when(repository.saveAndFlush(any(Tag.class))).thenAnswer(call -> call.getArgument(0));

		var response = service().create(new TagRequest("vi", " Pets ", "pets"));

		assertThat(response.name()).isEqualTo("Pets");
		assertThat(response.slug()).isEqualTo("pets");
	}

	@Test
	void theSlugIsUniquePerLanguageButMayStayWithItsOwnTag() {
		Tag tag = existing("pets");
		when(repository.existsByLocaleAndSlug("vi", "taken")).thenReturn(true);
		when(repository.findById(tag.getId())).thenReturn(Optional.of(tag));
		when(repository.existsByLocaleAndSlugAndIdNot("vi", "pets", tag.getId())).thenReturn(false);
		when(repository.existsByLocaleAndSlugAndIdNot("vi", "taken", tag.getId())).thenReturn(true);
		when(repository.saveAndFlush(tag)).thenReturn(tag);

		assertThatThrownBy(() -> service().create(new TagRequest("vi", "X", "taken")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		assertThat(service().update(tag.getId(), new TagRequest("vi", "Renamed", "pets")).name()).isEqualTo("Renamed");
		assertThatThrownBy(() -> service().update(tag.getId(), new TagRequest("vi", "X", "taken")))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
	}

	@Test
	void aTagInUseCannotBeDeleted() {
		Tag tag = existing("pets");
		when(repository.findById(tag.getId())).thenReturn(Optional.of(tag));
		when(repository.usedByPosts(tag.getId())).thenReturn(true, false);

		assertThatThrownBy(() -> service().delete(tag.getId()))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));
		verify(repository, never()).delete(any(Tag.class));

		service().delete(tag.getId());
		verify(repository).delete(tag);
	}

	@Test
	void unknownTagsAreNotFoundAndListIgnoresBlankLocale() {
		UUID unknown = UUID.randomUUID();
		when(repository.findById(unknown)).thenReturn(Optional.empty());
		when(repository.search(any())).thenReturn(List.of(existing("a")));

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThat(service().list(" ")).hasSize(1);
		verify(repository).search(null);
	}

}
