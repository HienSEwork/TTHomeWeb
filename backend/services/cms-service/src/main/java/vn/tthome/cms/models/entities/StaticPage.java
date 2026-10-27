package vn.tthome.cms.models.entities;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** A static page such as the about page or a policy; one row per language, linked by the translation group. */
@Entity
@Table(name = "page")
@Getter
@Setter
@NoArgsConstructor
public class StaticPage {

	@Id
	private UUID id;

	@Column(name = "translation_group_id", nullable = false, updatable = false)
	private UUID translationGroupId;

	@Column(nullable = false)
	private String locale;

	@Column(nullable = false)
	private String slug;

	@Column(nullable = false)
	private String title;

	private String content;

	@Column(nullable = false)
	private String status = "published";

}
