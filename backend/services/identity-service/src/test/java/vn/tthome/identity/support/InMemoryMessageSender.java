package vn.tthome.identity.support;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.services.messagesender.MessageSender;

/** Test double: remembers the last code sent per target and purpose. Picked up by component scan in tests only. */
@Primary
@Component
public class InMemoryMessageSender implements MessageSender {

	private final Map<String, String> lastCodes = new ConcurrentHashMap<>();
	private final Map<String, Integer> sendCounts = new ConcurrentHashMap<>();

	@Override
	public void send(OtpChannel channel, String target, OtpPurpose purpose, String code) {
		lastCodes.put(key(target, purpose), code);
		sendCounts.merge(target, 1, Integer::sum);
	}

	public String lastCode(String target, OtpPurpose purpose) {
		return lastCodes.get(key(target, purpose));
	}

	public int sendCount(String target) {
		return sendCounts.getOrDefault(target, 0);
	}

	private static String key(String target, OtpPurpose purpose) {
		return target + "|" + purpose.value();
	}

}
