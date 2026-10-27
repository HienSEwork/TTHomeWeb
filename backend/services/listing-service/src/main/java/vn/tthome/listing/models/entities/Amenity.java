package vn.tthome.listing.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "amenity")
@Getter
@Setter
@NoArgsConstructor
public class Amenity {

	@Id
	private Short id;

	@Column(nullable = false, unique = true)
	private String code;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String scope;

	private String icon;

	@Column(name = "sort_order", nullable = false)
	private Short sortOrder = 0;

	@Column(name = "is_filter", nullable = false)
	private boolean filter = true;

}
