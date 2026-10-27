package vn.tthome.media.models.entities;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Metadata of a file stored on Cloudinary; the file itself never passes through this service. */
@Entity
@Table(name = "asset")
@Getter
@Setter
@NoArgsConstructor
public class MediaAsset {

	@Id
	private UUID id;

	@Column(name = "public_id", nullable = false, updatable = false)
	private String publicId;

	@Column(name = "resource_type", nullable = false)
	private String resourceType;

	private String format;

	private Long bytes;

	private Integer width;

	private Integer height;

	@Column(name = "duration_sec")
	private BigDecimal durationSec;

	@Column(name = "cloud_version")
	private Long cloudVersion;

	@Column(name = "secure_url", nullable = false)
	private String secureUrl;

	private String folder;

	@Column(name = "alt_text")
	private String altText;

	@Column(name = "uploaded_by")
	private UUID uploadedBy;

	@Column(nullable = false)
	private String source = "upload";

	@Column(nullable = false)
	private String moderation = "approved";

	@Column(name = "created_at", insertable = false, updatable = false)
	private Instant createdAt;

	@Column(name = "deleted_at")
	private Instant deletedAt;

}
