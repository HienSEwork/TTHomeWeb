package vn.tthome.cms.services.menuitem;

import java.util.List;
import java.util.UUID;

import vn.tthome.cms.models.dtos.MenuItemRequest;
import vn.tthome.cms.models.dtos.MenuItemResponse;

public interface MenuItemService {

	/** The menu-items that match every given filter (blank filters are ignored), in display order. */
	List<MenuItemResponse> list(String locale, String location);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown menuItem. */
	MenuItemResponse get(UUID id);

	/** @throws vn.tthome.common.error.ApiException 400 VALIDATION_ERROR for values that do not fit together. */
	MenuItemResponse create(MenuItemRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND, 400 VALIDATION_ERROR as for create. */
	MenuItemResponse update(UUID id, MenuItemRequest request);

	/** @throws vn.tthome.common.error.ApiException 404 NOT_FOUND for an unknown menuItem, 409 CONFLICT while it has children. */
	void delete(UUID id);

}
