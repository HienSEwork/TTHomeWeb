package vn.tthome.cms.models.entities;

import java.time.Instant;
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
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** An article. One row per language, linked to its translations by the translation group. */
@Entity
@Table(name = "post")
@Getter
@Setter
@NoArgsConstructor
public class Post {

	@Id
	private UUID id;

	@Column(name = "translation_group_id", nullable = false, updatable = false)
	private UUID translationGroupId;

	@Column(nullable = false, updatable = false)
	private String locale;

	@Column(name = "category_id")
	private UUID categoryId;

	@Column(name = "author_id", updatable = false)
	private UUID authorId;

	@Column(name = "author_name")
	private String authorName;

	@Column(nullable = false)
	private String title;

	@Column(nullable = false)
	private String slug;

	private String excerpt;

	@Column(nullable = false)
	private String content;

	@Column(name = "cover_url")
	private String coverUrl;

	@Column(name = "read_minutes")
	private Short readMinutes;

	@Column(name = "view_count", insertable = false, updatable = false)
	private int viewCount;

	@Column(nullable = false)
	private String status = "draft";

	@Column(name = "published_at")
	private Instant publishedAt;

	@Column(name = "deleted_at")
	private Instant deletedAt;

	@BatchSize(size = 50)
	@ManyToMany(fetch = FetchType.LAZY)
	@JoinTable(name = "post_tag", joinColumns = @JoinColumn(name = "post_id"), inverseJoinColumns = @JoinColumn(name = "tag_id"))
	private Set<Tag> tags = new HashSet<>();

}
