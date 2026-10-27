package vn.tthome.listing.models.entities;

import java.math.BigDecimal;
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
import java.time.Instant;

/** A building or complex that holds rooms. The counters are kept by the database queries that change rooms. */
@Entity
@Table(name = "project")
@Getter
@Setter
@NoArgsConstructor
public class Project {

	@Id
	private UUID id;

	@Column(nullable = false, updatable = false)
	private String code;

	@Column(nullable = false)
	private String name;

	@Column(nullable = false)
	private String slug;

	@Column(name = "street_address")
	private String streetAddress;

	@Column(name = "ward_id")
	private Integer wardId;

	@Column(name = "ward_new_id")
	private Integer wardNewId;

	@Column(name = "district_id")
	private Integer districtId;

	private Double lat;

	private Double lng;

	@Column(name = "owner_user_id")
	private UUID ownerUserId;

	@Column(name = "manager_user_id")
	private UUID managerUserId;

	@Column(name = "is_exclusive", nullable = false)
	private boolean exclusive;

	@Column(name = "pet_policy", nullable = false)
	private String petPolicy = "none";

	@Column(name = "ev_parking", nullable = false)
	private boolean evParking;

	@Column(name = "free_hours")
	private Boolean freeHours;

	@Column(name = "max_guests_note")
	private String maxGuestsNote;

	@Column(name = "house_rules")
	private String houseRules;

	@Column(name = "fee_electric")
	private BigDecimal feeElectric;

	@Column(name = "fee_water")
	private BigDecimal feeWater;

	@Column(name = "fee_service")
	private BigDecimal feeService;

	@Column(name = "fee_parking")
	private BigDecimal feeParking;

	@Column(name = "fee_note")
	private String feeNote;

	private String description;

	@Column(name = "cover_asset_id")
	private UUID coverAssetId;

	@Column(name = "video_asset_id")
	private UUID videoAssetId;

	@Column(nullable = false)
	private String status = "active";

	@Column(name = "vacant_count", insertable = false, updatable = false)
	private int vacantCount;

	@Column(name = "total_rooms", insertable = false, updatable = false)
	private int totalRooms;

	@Column(name = "min_price", insertable = false, updatable = false)
	private BigDecimal minPrice;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	@Version
	private Integer version;

	@BatchSize(size = 50)
	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(name = "project_amenity", joinColumns = @JoinColumn(name = "project_id"),
			inverseJoinColumns = @JoinColumn(name = "amenity_id"))
	private Set<Amenity> amenities = new HashSet<>();

}
