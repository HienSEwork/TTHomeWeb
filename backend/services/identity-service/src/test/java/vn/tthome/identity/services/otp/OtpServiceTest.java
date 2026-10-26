package vn.tthome.identity.services.otp;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.services.otp.impl.OtpServiceImpl;
import vn.tthome.identity.support.InMemoryMessageSender;
import vn.tthome.identity.support.InMemoryOtpRepository;
import vn.tthome.identity.support.MutableClock;
import vn.tthome.identity.support.TestAuthProperties;

class OtpServiceTest {

	private static final String PHONE = "+84912345678";
	private static final String IP = "203.0.113.7";

	private MutableClock clock;
	private InMemoryOtpRepository store;
	private InMemoryMessageSender sender;
	private OtpService otp;

	@BeforeEach
	void setUp() {
		clock = new MutableClock(Instant.parse("2026-10-27T00:00:00Z"));
		store = new InMemoryOtpRepository(clock);
		sender = new InMemoryMessageSender();
		otp = new OtpServiceImpl(store.repository(), sender, TestAuthProperties.defaults(), clock);
	}

	private static void assertCode(Runnable call, String code, int status) {
		assertThatThrownBy(call::run).isInstanceOfSatisfying(ApiException.class, e -> {
			assertThat(e.code()).isEqualTo(code);
			assertThat(e.status().value()).isEqualTo(status);
		});
	}

	private String request(String target, String ip) {
		otp.request(target, OtpPurpose.REGISTER, OtpChannel.SMS, ip);
		return sender.lastCode(target, OtpPurpose.REGISTER);
	}

	@Test
	void requestStoresHashedCodeNotThePlainCode() {
		String code = request(PHONE, IP);

		assertThat(store.rows()).hasSize(1);
		assertThat(store.rows().get(0).getCodeHash()).isNotEqualTo(code).doesNotContain(code);
	}

	@Test
	void requestSendsTheSixDigitCodeThroughTheSender() {
		String code = request(PHONE, IP);

		assertThat(code).matches("\\d{6}");
		assertThat(sender.sendCount(PHONE)).isEqualTo(1);
	}

	@Test
	void secondRequestWithin60SecondsIsRateLimited() {
		request(PHONE, IP);
		clock.advance(Duration.ofSeconds(30));

		assertCode(() -> request(PHONE, IP), "OTP_RATE_LIMITED", 429);
	}

	@Test
	void sixthRequestInAnHourIsRateLimited() {
		for (int i = 0; i < 5; i++) {
			request(PHONE, IP);
			clock.advance(Duration.ofSeconds(61));
		}

		assertCode(() -> request(PHONE, IP), "OTP_RATE_LIMITED", 429);
	}

	@Test
	void twentyFirstRequestFromOneIpIsRateLimited() {
		for (int i = 0; i < 20; i++) {
			request("+8490000" + String.format("%04d", i), IP);
		}

		assertCode(() -> request("+84900009999", IP), "OTP_RATE_LIMITED", 429);
		assertThat(request("+84900009998", "198.51.100.1")).matches("\\d{6}");
	}

	@Test
	void verifyAcceptsCorrectCodeOnceThenRejectsReplay() {
		String code = request(PHONE, IP);

		otp.verify(PHONE, OtpPurpose.REGISTER, code);

		assertCode(() -> otp.verify(PHONE, OtpPurpose.REGISTER, code), "OTP_INVALID", 400);
	}

	@Test
	void fifthWrongAttemptBurnsTheChallengeEvenIfLaterCodeIsRight() {
		String code = request(PHONE, IP);
		String wrong = code.equals("000000") ? "111111" : "000000";
		for (int i = 0; i < 5; i++) {
			assertCode(() -> otp.verify(PHONE, OtpPurpose.REGISTER, wrong), "OTP_INVALID", 400);
		}

		assertCode(() -> otp.verify(PHONE, OtpPurpose.REGISTER, code), "OTP_INVALID", 400);
	}

	@Test
	void expiredCodeIsRejected() {
		String code = request(PHONE, IP);
		clock.advance(Duration.ofMinutes(5).plusSeconds(1));

		assertCode(() -> otp.verify(PHONE, OtpPurpose.REGISTER, code), "OTP_INVALID", 400);
	}

	@Test
	void codeForAnotherPurposeIsRejected() {
		String code = request(PHONE, IP);

		assertCode(() -> otp.verify(PHONE, OtpPurpose.RESET_PASSWORD, code), "OTP_INVALID", 400);
	}

	@Test
	void reserveCountsTowardLimitsButSendsNothing() {
		otp.reserve(PHONE, OtpPurpose.REGISTER, OtpChannel.SMS, IP);

		assertThat(sender.sendCount(PHONE)).isZero();
		assertThat(store.rows()).hasSize(1);
		assertCode(() -> request(PHONE, IP), "OTP_RATE_LIMITED", 429);
	}

	@Test
	void reservedChallengeCanNeverBeVerified() {
		otp.reserve(PHONE, OtpPurpose.REGISTER, OtpChannel.SMS, IP);

		assertCode(() -> otp.verify(PHONE, OtpPurpose.REGISTER, "123456"), "OTP_INVALID", 400);
	}

	@Test
	void challengeTimestampsComeFromTheInjectedClock() {
		clock.advance(Duration.ofDays(3));
		request(PHONE, IP);

		assertThat(store.rows().get(0).getCreatedAt()).isEqualTo(clock.instant());
	}

}
