package vn.tthome.identity.services.messagesender.impl;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Service;

import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.services.messagesender.MessageSender;

/**
 * Development stand-in for a real SMS / Zalo / email provider: writes the code to the log.
 * Active only on non-production profiles, so a production start without a real sender fails fast.
 */
@Service
@Profile({ "dev", "test", "supabase" })
public class LoggingMessageSender implements MessageSender {

	private static final Logger log = LoggerFactory.getLogger(LoggingMessageSender.class);

	@Override
	public void send(OtpChannel channel, String target, OtpPurpose purpose, String code) {
		log.info("[DEV ONLY] OTP via {} to {} for {}: {}", channel.value(), target, purpose.value(), code);
	}

}
