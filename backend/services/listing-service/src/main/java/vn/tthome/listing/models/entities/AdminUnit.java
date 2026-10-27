package vn.tthome.listing.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A province, district or ward in one of the two administrative schemes (before and after the 2025 merger). */
@Entity
@Table(name = "admin_unit")
@Getter
@Setter
@NoArgsConstructor
public class AdminUnit {

	@Id
	private Integer id;

	@Column(name = "parent_id")
	private Integer parentId;

	@Column(nullable = false)
	private Short level;

	@Column(nullable = false)
	private String scheme;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String slug;

	@Column(name = "center_lat")
	private Double centerLat;

	@Column(name = "center_lng")
	private Double centerLng;

}
