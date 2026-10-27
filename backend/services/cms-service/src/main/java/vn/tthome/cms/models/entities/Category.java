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
@Table(name = "category")
@Getter
@Setter
@NoArgsConstructor
public class Category {

	@Id
	private UUID id;

	@Column(name = "locale", nullable = false)
	private String locale;

	@Column(name = "parent_id")
	private UUID parentId;

	@Column(name = "name", nullable = false)
	private String name;

	@Column(name = "slug", nullable = false)
	private String slug;

	@Column(name = "sort_order", nullable = false)
	private Short sortOrder;

}
