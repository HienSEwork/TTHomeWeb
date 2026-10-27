package vn.tthome.cms.services.menuitem.impl;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.cms.models.dtos.MenuItemRequest;
import vn.tthome.cms.models.dtos.MenuItemResponse;
import vn.tthome.cms.models.entities.MenuItem;
import vn.tthome.cms.repos.menuitem.MenuItemRepository;
import vn.tthome.cms.services.menuitem.MenuItemService;

@Service
public class MenuItemServiceImpl implements MenuItemService {

	private final MenuItemRepository repository;

	public MenuItemServiceImpl(MenuItemRepository repository) {
		this.repository = repository;
	}

	@Override
	@Transactional(readOnly = true)
	public List<MenuItemResponse> list(String locale, String location) {
		return repository.search(blank(locale), blank(location)).stream().map(MenuItemResponse::from).toList();
	}

	@Override
	@Transactional(readOnly = true)
	public MenuItemResponse get(UUID id) {
		return MenuItemResponse.from(find(id));
	}

	@Override
	@Transactional
	public MenuItemResponse create(MenuItemRequest request) {
		MenuItem e = new MenuItem();
		e.setId(UUID.randomUUID());
		check(null, request);
		apply(e, request);
		return MenuItemResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public MenuItemResponse update(UUID id, MenuItemRequest request) {
		MenuItem e = find(id);
		check(e, request);
		apply(e, request);
		return MenuItemResponse.from(repository.saveAndFlush(e));
	}

	@Override
	@Transactional
	public void delete(UUID id) {
		MenuItem e = find(id);
		if (repository.existsByParentId(id)) {
			throw new ApiException(HttpStatus.CONFLICT, "CONFLICT", "The item still has children");
		}
		repository.delete(e);
		repository.flush();
	}

	private MenuItem find(UUID id) {
		return repository.findById(id)
				.orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "NOT_FOUND", "MenuItem not found"));
	}

	/** Rejects values that do not fit together; current is the stored menuItem on update and null on create. */
	private void check(MenuItem current, MenuItemRequest r) {
		boolean hasChildren = current != null && repository.existsByParentId(current.getId());
		if (r.parentId() != null) {
			MenuItem parent = repository.findById(r.parentId()).orElseThrow(() -> invalid("Unknown parent"));
			if (current != null && current.getId().equals(parent.getId())) {
				throw invalid("An item cannot be its own parent");
			}
			if (parent.getParentId() != null || hasChildren) {
				throw invalid("Menus have two levels at most");
			}
			if (!parent.getLocale().equals(r.locale()) || !parent.getLocation().equals(r.location())) {
				throw invalid("The parent must be in the same menu");
			}
		}
		if (hasChildren && (!current.getLocale().equals(r.locale()) || !current.getLocation().equals(r.location()))) {
			throw invalid("The children must stay in the same menu");
		}
	}

	private static void apply(MenuItem e, MenuItemRequest r) {
		e.setLocale(r.locale());
		e.setLocation(r.location());
		e.setParentId(r.parentId());
		e.setLabel(r.label().strip());
		e.setUrl(r.url().strip());
		e.setExternal(Boolean.TRUE.equals(r.external()));
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
