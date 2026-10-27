package vn.tthome.listing.models.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A photo, video, floor plan or 360 view of a project or room; the asset itself lives in media-service. */
@Entity
@Table(name = "media_link")
@Getter
@Setter
@NoArgsConstructor
public class MediaLink {

	@Id
	private UUID id;

	@Column(name = "owner_type", nullable = false)
	private String ownerType;

	@Column(name = "owner_id", nullable = false)
	private UUID ownerId;

	@Column(name = "asset_id", nullable = false)
	private UUID assetId;

	@Column(nullable = false)
	private String kind;

	@Column(name = "sort_order", nullable = false)
	private Short sortOrder;

	@Column(name = "is_cover", nullable = false)
	private boolean cover;

}
