package vn.tthome.cms.repos.faq;

import java.util.List;

import vn.tthome.cms.models.entities.Faq;

/** Hand-written queries for faqs; methods are added when a task needs an optimized query. */
public interface FaqRepositoryCustom {

	/** The faqs that match every given filter (null filters are ignored), in display order. */
	List<Faq> search(String locale, String audience, Boolean active);

}
