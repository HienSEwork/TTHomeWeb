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
import vn.tthome.cms.models.dtos.MenuItemRequest;
import vn.tthome.cms.models.dtos.MenuItemResponse;
import vn.tthome.cms.services.menuitem.MenuItemService;

@RestController
@RequestMapping("/api/v1/admin/cms/menu-items")
@PreAuthorize("hasRole('ADMIN')")
public class MenuItemController {

	private final MenuItemService menuItems;

	public MenuItemController(MenuItemService menuItems) {
		this.menuItems = menuItems;
	}

	@GetMapping
	public List<MenuItemResponse> list(@RequestParam(required = false) String locale, @RequestParam(required = false) String location) {
		return menuItems.list(locale, location);
	}

	@GetMapping("/{id}")
	public MenuItemResponse get(@PathVariable UUID id) {
		return menuItems.get(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public MenuItemResponse create(@Valid @RequestBody MenuItemRequest body) {
		return menuItems.create(body);
	}

	@PutMapping("/{id}")
	public MenuItemResponse update(@PathVariable UUID id, @Valid @RequestBody MenuItemRequest body) {
		return menuItems.update(id, body);
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void delete(@PathVariable UUID id) {
		menuItems.delete(id);
	}

}
