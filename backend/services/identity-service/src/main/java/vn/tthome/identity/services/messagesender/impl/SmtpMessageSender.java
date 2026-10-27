package vn.tthome.identity.services.messagesender.impl;

import java.util.concurrent.Executor;
import java.util.concurrent.Executors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Primary;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.Assert;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import vn.tthome.common.error.ApiException;
import vn.tthome.identity.config.AuthProperties;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.services.messagesender.MessageSender;

/**
 * Delivers email codes through the configured SMTP server (tthome.mail.enabled=true).
 *
 * <p>The email is handed to a background executor: a registered address never sends anything, so a synchronous send
 * would make the request time reveal whether the address has an account. A failed delivery is logged (never with the
 * code) and the user simply asks for a new code once the resend cooldown has passed.
 *
 * <p>There is no SMS provider yet: SMS goes to the development fallback when one is active, otherwise it is refused
 * with 503 CHANNEL_UNAVAILABLE.
 */
@Service
@Primary
@ConditionalOnProperty(name = "tthome.mail.enabled", havingValue = "true")
public class SmtpMessageSender implements MessageSender {

	private static final Logger log = LoggerFactory.getLogger(SmtpMessageSender.class);

	private final JavaMailSender mail;
	private final String from;
	private final long ttlMinutes;
	private final ObjectProvider<LoggingMessageSender> smsFallback;
	private final Executor executor;

	@Autowired
	public SmtpMessageSender(JavaMailSender mail, @Value("${tthome.mail.from:}") String from, AuthProperties props,
			ObjectProvider<LoggingMessageSender> smsFallback) {
		this(mail, from, props, smsFallback, Executors.newVirtualThreadPerTaskExecutor());
	}

	public SmtpMessageSender(JavaMailSender mail, String from, AuthProperties props,
			ObjectProvider<LoggingMessageSender> smsFallback, Executor executor) {
		Assert.hasText(from, "tthome.mail.from (MAIL_FROM) is required when tthome.mail.enabled=true");
		this.mail = mail;
		this.from = from.trim();
		this.ttlMinutes = props.otpTtl().toMinutes();
		this.smsFallback = smsFallback;
		this.executor = executor;
	}

	@Override
	public void send(OtpChannel channel, String target, OtpPurpose purpose, String code) {
		if (channel != OtpChannel.EMAIL) {
			LoggingMessageSender fallback = smsFallback.getIfAvailable();
			if (fallback == null) {
				throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "CHANNEL_UNAVAILABLE",
						"This delivery channel is not available");
			}
			fallback.send(channel, target, purpose, code);
			return;
		}
		executor.execute(() -> deliver(target, purpose, code));
	}

	private void deliver(String target, OtpPurpose purpose, String code) {
		try {
			MimeMessage message = mail.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
			helper.setFrom(from);
			helper.setTo(target);
			helper.setSubject(subject(purpose));
			helper.setText(body(code));
			mail.send(message);
		} catch (MessagingException | MailException e) {
			log.error("Could not deliver a {} code by email: {}", purpose.value(), e.getMessage());
		}
	}

	private static String subject(OtpPurpose purpose) {
		return switch (purpose) {
			case REGISTER -> "TTHome: xác minh email đăng ký tài khoản";
			case LOGIN -> "TTHome: mã đăng nhập";
			case RESET_PASSWORD -> "TTHome: mã đặt lại mật khẩu";
			case CHANGE_CONTACT -> "TTHome: mã xác nhận thay đổi thông tin liên hệ";
		};
	}

	private String body(String code) {
		return "Mã xác minh của bạn là: " + code + "\n\n"
				+ "Mã có hiệu lực trong " + ttlMinutes + " phút. Không chia sẻ mã này cho bất kỳ ai, "
				+ "kể cả nhân viên TTHome.\n"
				+ "Nếu bạn không thực hiện yêu cầu này, hãy bỏ qua email này.\n";
	}

}
