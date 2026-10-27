package vn.tthome.identity.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "permission")
@Getter
@NoArgsConstructor
public class Permission {

	@Id
	private Short id;

	@Column(nullable = false, unique = true)
	private String code;

	private String description;

}
