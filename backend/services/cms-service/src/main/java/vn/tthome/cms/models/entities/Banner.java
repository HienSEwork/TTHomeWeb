package vn.tthome.cms.models.entities;

import java.time.Instant;
import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "banner")
@Getter
@Setter
@NoArgsConstructor
public class Banner {

	@Id
	private UUID id;

	@Column(name = "locale", nullable = false)
	private String locale;

	@Column(name = "placement", nullable = false)
	private String placement;

	@Column(name = "title")
	private String title;

	@Column(name = "image_url", nullable = false)
	private String imageUrl;

	@Column(name = "mobile_image_url")
	private String mobileImageUrl;

	@Column(name = "link_url")
	private String linkUrl;

	@Column(name = "sort_order", nullable = false)
	private Short sortOrder;

	@Column(name = "starts_at")
	private Instant startsAt;

	@Column(name = "ends_at")
	private Instant endsAt;

	@Column(name = "is_active", nullable = false)
	private boolean active = true;

}
