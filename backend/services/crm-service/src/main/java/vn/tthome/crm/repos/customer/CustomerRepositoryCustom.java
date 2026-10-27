package vn.tthome.crm.repos.customer;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.crm.models.entities.Customer;

/** Hand-written queries for customer; methods are added when a task needs an optimized query. */
public interface CustomerRepositoryCustom {

	/**
	 * One page of non-deleted customers, most recently created first. Every filter is optional (null): stage, owner
	 * and source exactly, text as a case-insensitive substring of the name, phone or email.
	 */
	Page<Customer> search(String stage, UUID ownerUserId, String source, String text, Pageable pageable);

}
