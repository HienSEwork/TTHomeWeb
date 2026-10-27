package vn.tthome.listing.models.entities;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "room")
@Getter
@Setter
@NoArgsConstructor
public class Room {

	@Id
	private UUID id;

	@Column(name = "project_id", nullable = false, updatable = false)
	private UUID projectId;

	@Column(nullable = false)
	private String code;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private String slug;

	@Column(name = "room_type", nullable = false)
	private String roomType;

	private Short floor;

	@Column(name = "area_m2")
	private BigDecimal areaM2;

	private BigDecimal price;

	@Column(name = "price_incl_utility", nullable = false)
	private boolean priceInclUtility;

	private BigDecimal deposit;

	private String furniture;

	@Column(name = "has_balcony")
	private Boolean hasBalcony;

	@Column(name = "has_window")
	private Boolean hasWindow;

	@Column(name = "max_occupants")
	private Short maxOccupants;

	@Column(nullable = false)
	private String status = "available";

	@Column(name = "available_from")
	private LocalDate availableFrom;

	@Column(name = "is_promo", nullable = false)
	private boolean promo;

	@Column(name = "promo_note")
	private String promoNote;

	@Column(name = "cover_asset_id")
	private UUID coverAssetId;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Version
	private Integer version;

	@BatchSize(size = 50)
	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(name = "room_amenity", joinColumns = @JoinColumn(name = "room_id"),
			inverseJoinColumns = @JoinColumn(name = "amenity_id"))
	private Set<Amenity> amenities = new HashSet<>();

}
