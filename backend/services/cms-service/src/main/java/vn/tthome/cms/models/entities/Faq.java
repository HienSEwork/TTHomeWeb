package vn.tthome.cms.models.entities;

import java.util.UUID;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "faq")
@Getter
@Setter
@NoArgsConstructor
public class Faq {

	@Id
	private UUID id;

	@Column(name = "locale", nullable = false)
	private String locale;

	@Column(name = "audience", nullable = false)
	private String audience;

	@Column(name = "question", nullable = false)
	private String question;

	@Column(name = "answer", nullable = false)
	private String answer;

	@Column(name = "sort_order", nullable = false)
	private Short sortOrder;

	@Column(name = "is_active", nullable = false)
	private boolean active = true;

}
