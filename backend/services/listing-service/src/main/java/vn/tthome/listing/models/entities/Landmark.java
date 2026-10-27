package vn.tthome.listing.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A place people search near: university, mall, industrial zone, hospital. */
@Entity
@Table(name = "landmark")
@Getter
@Setter
@NoArgsConstructor
public class Landmark {

	@Id
	private Short id;

	@Column(nullable = false, unique = true)
	private String code;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String kind;

	private Double lat;

	private Double lng;

	@Column(name = "radius_m", nullable = false)
	private int radiusM = 3000;

	@Column(name = "sort_order", nullable = false)
	private Short sortOrder = 0;

}
