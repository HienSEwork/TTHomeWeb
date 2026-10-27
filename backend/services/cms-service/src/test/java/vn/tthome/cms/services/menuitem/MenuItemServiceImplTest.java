package vn.tthome.cms.services.menuitem;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import vn.tthome.cms.models.dtos.MenuItemRequest;
import vn.tthome.cms.models.dtos.MenuItemResponse;
import vn.tthome.cms.models.entities.MenuItem;
import vn.tthome.cms.repos.menuitem.MenuItemRepository;
import vn.tthome.cms.services.menuitem.impl.MenuItemServiceImpl;
import vn.tthome.common.error.ApiException;

@ExtendWith(MockitoExtension.class)
class MenuItemServiceImplTest {

	@Mock
	MenuItemRepository repository;

	private MenuItemServiceImpl service() {
		return new MenuItemServiceImpl(repository);
	}

	private static MenuItem existing() {
		MenuItem item = new MenuItem();
		item.setId(UUID.randomUUID());
		item.setLocale("vi");
		item.setLocation("header");
		item.setLabel("Old");
		item.setUrl("/old");
		item.setSortOrder((short) 9);
		return item;
	}

	private static MenuItem child(MenuItem parent) {
		MenuItem item = existing();
		item.setParentId(parent.getId());
		return item;
	}

	private static MenuItemRequest request(UUID parent) {
		return new MenuItemRequest("vi", "header", parent, " Rooms ", "/rooms", false, (short) 1, true);
	}

	private static void assertApi(Throwable thrown, HttpStatus status, String code) {
		assertThat(thrown).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.status()).isEqualTo(status);
			assertThat(e.code()).isEqualTo(code);
		});
	}

	@Test
	void createSavesTheStrippedValuesUnderAGeneratedId() {
		when(repository.saveAndFlush(any(MenuItem.class))).thenAnswer(call -> call.getArgument(0));

		MenuItemResponse response = service().create(request(null));

		ArgumentCaptor<MenuItem> saved = ArgumentCaptor.forClass(MenuItem.class);
		verify(repository).saveAndFlush(saved.capture());
		assertThat(saved.getValue().getId()).isNotNull();
		assertThat(response.id()).isEqualTo(saved.getValue().getId());
		assertThat(response.label()).isEqualTo("Rooms");
		assertThat(response.url()).isEqualTo("/rooms");
		assertThat(response.location()).isEqualTo("header");
	}

	@Test
	void updateReplacesTheFields() {
		MenuItem existing = existing();
		when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));
		when(repository.saveAndFlush(existing)).thenReturn(existing);

		MenuItemResponse response = service().update(existing.getId(), request(null));

		assertThat(response.id()).isEqualTo(existing.getId());
		assertThat(response.label()).isEqualTo("Rooms");
		assertThat(response.url()).isEqualTo("/rooms");
		assertThat(response.location()).isEqualTo("header");
	}

	@Test
	void getUpdateAndDeleteKnowUnknownIds() {
		UUID unknown = UUID.randomUUID();
		when(repository.findById(unknown)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> service().get(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().update(unknown, request(null)))
				.satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		assertThatThrownBy(() -> service().delete(unknown)).satisfies(e -> assertApi(e, HttpStatus.NOT_FOUND, "NOT_FOUND"));
		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void deleteRemovesTheRecord() {
		MenuItem existing = existing();
		when(repository.findById(existing.getId())).thenReturn(Optional.of(existing));

		service().delete(existing.getId());

		verify(repository).delete(existing);
	}

	@Test
	void anItemMayHangUnderATopLevelItemOfTheSameMenu() {
		MenuItem parent = existing();
		when(repository.findById(parent.getId())).thenReturn(Optional.of(parent));
		when(repository.saveAndFlush(any(MenuItem.class))).thenAnswer(call -> call.getArgument(0));

		assertThat(service().create(request(parent.getId())).parentId()).isEqualTo(parent.getId());
	}

	@Test
	void parentsMustExistBeTopLevelAndShareTheMenu() {
		MenuItem top = existing();
		MenuItem nested = child(top);
		MenuItem otherMenu = existing();
		otherMenu.setLocation("footer_company");
		UUID unknown = UUID.randomUUID();
		when(repository.findById(nested.getId())).thenReturn(Optional.of(nested));
		when(repository.findById(otherMenu.getId())).thenReturn(Optional.of(otherMenu));
		when(repository.findById(unknown)).thenReturn(Optional.empty());

		for (UUID parent : List.of(unknown, nested.getId(), otherMenu.getId())) {
			assertThatThrownBy(() -> service().create(request(parent)))
					.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		}
		verify(repository, never()).saveAndFlush(any());
	}

	@Test
	void anItemCannotBeItsOwnParentOrGetAParentWhileItHasChildren() {
		MenuItem item = existing();
		MenuItem top = existing();
		when(repository.findById(item.getId())).thenReturn(Optional.of(item));
		when(repository.findById(top.getId())).thenReturn(Optional.of(top));
		when(repository.existsByParentId(item.getId())).thenReturn(false, true);

		assertThatThrownBy(() -> service().update(item.getId(), request(item.getId())))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
		assertThatThrownBy(() -> service().update(item.getId(), request(top.getId())))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
	}

	@Test
	void theChildrenMustStayInTheSameMenu() {
		MenuItem item = existing();
		when(repository.findById(item.getId())).thenReturn(Optional.of(item));
		when(repository.existsByParentId(item.getId())).thenReturn(true);
		MenuItemRequest moved = new MenuItemRequest("vi", "footer_connect", null, "Rooms", "/rooms", false, (short) 1, true);

		assertThatThrownBy(() -> service().update(item.getId(), moved))
				.satisfies(e -> assertApi(e, HttpStatus.BAD_REQUEST, "VALIDATION_ERROR"));
	}

	@Test
	void anItemWithChildrenCannotBeDeleted() {
		MenuItem item = existing();
		when(repository.findById(item.getId())).thenReturn(Optional.of(item));
		when(repository.existsByParentId(item.getId())).thenReturn(true);

		assertThatThrownBy(() -> service().delete(item.getId()))
				.satisfies(e -> assertApi(e, HttpStatus.CONFLICT, "CONFLICT"));

		verify(repository, never()).delete(any(MenuItem.class));
	}

	@Test
	void listPassesTheFilters() {
		when(repository.search(any(), any())).thenReturn(List.of(existing()));

		assertThat(service().list("vi", " ")).hasSize(1);

		verify(repository).search("vi", null);
	}

}
