package vn.tthome.identity.models.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "role")
@Getter
@NoArgsConstructor
public class Role {

	@Id
	private Short id;

	@Column(nullable = false, unique = true)
	private String code;

	@Column(nullable = false)
	private String name;

}
