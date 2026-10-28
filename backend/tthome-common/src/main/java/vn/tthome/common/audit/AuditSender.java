package vn.tthome.common.audit;

/** Delivers audit events to the audit log. It never throws: auditing must not break the request that is audited. */
public interface AuditSender {

	/**
	 * Sends the event on behalf of the admin who holds the bearer token. The token is what proves who the actor is,
	 * so the audit log does not trust a name in the body.
	 */
	void send(String authorization, AuditEvent event);

}
