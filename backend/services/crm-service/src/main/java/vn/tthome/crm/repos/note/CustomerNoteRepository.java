package vn.tthome.crm.repos.note;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import vn.tthome.crm.models.entities.CustomerNote;

public interface CustomerNoteRepository extends JpaRepository<CustomerNote, UUID>, CustomerNoteRepositoryCustom {

	/** The notes of a customer that the reader may see: public ones and the reader's own private ones. */
	@org.springframework.data.jpa.repository.Query("select n from CustomerNote n where n.customerId = :customerId"
			+ " and (n.privateNote = false or n.authorId = :reader) order by n.createdAt desc, n.id desc")
	java.util.List<CustomerNote> visibleTo(@org.springframework.data.repository.query.Param("customerId") UUID customerId,
			@org.springframework.data.repository.query.Param("reader") UUID reader);

}
