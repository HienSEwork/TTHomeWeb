package vn.tthome.identity.services.messagesender;

import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;

/** Port that delivers a one-time code to a phone number or an email address. */
public interface MessageSender {

	void send(OtpChannel channel, String target, OtpPurpose purpose, String code);

}
