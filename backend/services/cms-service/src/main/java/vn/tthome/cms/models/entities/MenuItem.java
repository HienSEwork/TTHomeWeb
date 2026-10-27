package vn.tthome.cms.models.entities;

import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "menu_item")
@Getter
@Setter
@NoArgsConstructor
public class MenuItem {

	@Id
	private UUID id;

	@Column(name = "locale", nullable = false)
	private String locale;

	@Column(name = "location", nullable = false)
	private String location;

	@Column(name = "parent_id")
	private UUID parentId;

	@Column(name = "label", nullable = false)
	private String label;

	@Column(name = "url", nullable = false)
	private String url;

	@Column(name = "is_external", nullable = false)
	private boolean external = false;

	@Column(name = "sort_order", nullable = false)
	private Short sortOrder;

	@Column(name = "is_active", nullable = false)
	private boolean active = true;

}
