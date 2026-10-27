package vn.tthome.crm.repos.consultrequest;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.crm.models.entities.ConsultRequest;

/** Hand-written queries for consultrequest; methods are added when a task needs an optimized query. */
public interface ConsultRequestRepositoryCustom {

	/**
	 * One page of consultation requests, newest first. Every filter is optional (null): status and assignee exactly,
	 * text as a substring of the name, phone or message.
	 */
	Page<ConsultRequest> search(String status, UUID assignedTo, String text, Pageable pageable);

}
