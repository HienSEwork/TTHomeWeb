package vn.tthome.cms.repos.partnerapplication;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import vn.tthome.cms.models.entities.PartnerApplication;

/** Hand-written queries for partner applications; methods are added when a task needs an optimized query. */
public interface PartnerApplicationRepositoryCustom {

	/**
	 * One page of applications, newest first. Every filter is optional (null): kind and status exactly, text as a
	 * case-insensitive substring of the name, phone, email or position.
	 */
	Page<PartnerApplication> search(String kind, String status, String text, Pageable pageable);

}
