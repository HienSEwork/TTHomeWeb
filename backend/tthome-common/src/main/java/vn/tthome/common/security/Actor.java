package vn.tthome.common.security;

import java.util.UUID;

/** Whoever made a request, as far as the audit log is concerned. The principals of the access tokens implement it. */
public interface Actor {

	UUID userId();

}
