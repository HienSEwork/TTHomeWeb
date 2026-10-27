package vn.tthome.identity.services.messagesender;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.support.DefaultListableBeanFactory;
import org.springframework.http.HttpStatus;
import org.springframework.mail.MailSendException;
import org.springframework.mail.javamail.JavaMailSenderImpl;

import jakarta.mail.Message;
import jakarta.mail.internet.MimeMessage;
import vn.tthome.common.error.ApiException;
import vn.tthome.identity.config.AuthProperties;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.services.messagesender.impl.LoggingMessageSender;
import vn.tthome.identity.services.messagesender.impl.SmtpMessageSender;

class SmtpMessageSenderTest {

	private static final AuthProperties PROPS = new AuthProperties("j".repeat(32), "p".repeat(16), Duration.ofMinutes(15),
			Duration.ofHours(24), Duration.ofDays(30), 5, Duration.ofMinutes(15), Duration.ofMinutes(5), 5,
			Duration.ofSeconds(60), 5, 20);

	/** Records instead of connecting to an SMTP server; can be told to fail like an unreachable server would. */
	private static final class RecordingMailSender extends JavaMailSenderImpl {

		final List<MimeMessage> sent = new ArrayList<>();
		boolean fail;

		@Override
		public void send(MimeMessage mimeMessage) {
			if (fail) {
				throw new MailSendException("smtp down");
			}
			sent.add(mimeMessage);
		}

	}

	private static ObjectProvider<LoggingMessageSender> noFallback() {
		return new DefaultListableBeanFactory().getBeanProvider(LoggingMessageSender.class);
	}

	private static ObjectProvider<LoggingMessageSender> fallback(LoggingMessageSender sender) {
		DefaultListableBeanFactory factory = new DefaultListableBeanFactory();
		factory.registerSingleton("logging", sender);
		return factory.getBeanProvider(LoggingMessageSender.class);
	}

	private static SmtpMessageSender sender(RecordingMailSender mail, ObjectProvider<LoggingMessageSender> sms) {
		return new SmtpMessageSender(mail, "TTHome <no-reply@tthome.vn>", PROPS, sms, Runnable::run);
	}

	@Test
	void emailCodeIsSentToTheAddressWithTheCodeAndItsLifetime() throws Exception {
		RecordingMailSender mail = new RecordingMailSender();

		sender(mail, noFallback()).send(OtpChannel.EMAIL, "an@example.com", OtpPurpose.REGISTER, "123456");

		assertThat(mail.sent).hasSize(1);
		MimeMessage message = mail.sent.get(0);
		assertThat(message.getRecipients(Message.RecipientType.TO)).hasSize(1);
		assertThat(message.getRecipients(Message.RecipientType.TO)[0].toString()).isEqualTo("an@example.com");
		assertThat(message.getFrom()[0].toString()).contains("no-reply@tthome.vn");
		assertThat(message.getSubject()).isNotBlank();
		assertThat((String) message.getContent()).contains("123456").contains("5 phút");
	}

	@Test
	void eachPurposeHasItsOwnSubject() throws Exception {
		RecordingMailSender mail = new RecordingMailSender();
		SmtpMessageSender sender = sender(mail, noFallback());

		for (OtpPurpose purpose : OtpPurpose.values()) {
			sender.send(OtpChannel.EMAIL, "an@example.com", purpose, "123456");
		}

		List<String> subjects = new ArrayList<>();
		for (MimeMessage message : mail.sent) {
			subjects.add(message.getSubject());
		}
		assertThat(subjects).hasSize(OtpPurpose.values().length).doesNotHaveDuplicates();
	}

	@Test
	void aDeliveryFailureDoesNotReachTheCaller() {
		RecordingMailSender mail = new RecordingMailSender();
		mail.fail = true;

		assertThatCode(() -> sender(mail, noFallback()).send(OtpChannel.EMAIL, "an@example.com", OtpPurpose.LOGIN, "123456"))
				.doesNotThrowAnyException();
		assertThat(mail.sent).isEmpty();
	}

	@Test
	void smsWithoutAProviderIs503AndSendsNoEmail() {
		RecordingMailSender mail = new RecordingMailSender();

		assertThatThrownBy(() -> sender(mail, noFallback()).send(OtpChannel.SMS, "+84912345678", OtpPurpose.LOGIN, "123456"))
				.isInstanceOfSatisfying(ApiException.class, e -> {
					assertThat(e.status()).isEqualTo(HttpStatus.SERVICE_UNAVAILABLE);
					assertThat(e.code()).isEqualTo("CHANNEL_UNAVAILABLE");
				});
		assertThat(mail.sent).isEmpty();
	}

	@Test
	void smsGoesToTheDevelopmentFallbackWhenOneIsPresent() {
		RecordingMailSender mail = new RecordingMailSender();

		assertThatCode(() -> sender(mail, fallback(new LoggingMessageSender()))
				.send(OtpChannel.SMS, "+84912345678", OtpPurpose.LOGIN, "123456")).doesNotThrowAnyException();
		assertThat(mail.sent).isEmpty();
	}

	@Test
	void aBlankSenderAddressFailsAtStartup() {
		assertThatThrownBy(() -> new SmtpMessageSender(new RecordingMailSender(), " ", PROPS, noFallback(), Runnable::run))
				.isInstanceOf(IllegalArgumentException.class).hasMessageContaining("MAIL_FROM");
	}

}
