package vn.tthome.crm.repos.customer;

import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.crm.models.entities.Customer;

/** Hand-written queries for customer; methods are added when a task needs an optimized query. */
public interface CustomerRepositoryCustom {

	/**
	 * One page of non-deleted customers, most recently created first. Every filter is optional (null): stage, owner,
	 * referrer and source exactly, text as a case-insensitive substring of the name, phone or email.
	 */
	/**
	 * The live customers created within [from, to) counted by one of their columns, which is "source" or "stage".
	 *
	 * @throws IllegalArgumentException for any other column, so no caller-supplied text reaches the query.
	 */
	java.util.Map<String, Long> countBy(String column, java.time.Instant from, java.time.Instant to);

	Page<Customer> search(String stage, UUID ownerUserId, UUID referrerUserId, String source, String text, Pageable pageable);

}
