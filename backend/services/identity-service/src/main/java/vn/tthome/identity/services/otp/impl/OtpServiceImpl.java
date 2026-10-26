package vn.tthome.identity.services.otp.impl;

import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.Optional;
import java.util.regex.Pattern;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.config.AuthProperties;
import vn.tthome.identity.models.entities.OtpChallenge;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.repos.otpchallenge.OtpChallengeRepository;
import vn.tthome.identity.services.messagesender.MessageSender;
import vn.tthome.identity.services.otp.OtpService;

@Service
public class OtpServiceImpl implements OtpService {

	private static final Pattern IP_LITERAL = Pattern.compile("^[0-9a-fA-F:.]+$");
	private static final Duration WINDOW = Duration.ofHours(1);

	private final OtpChallengeRepository challenges;
	private final MessageSender sender;
	private final AuthProperties props;
	private final Clock clock;
	private final SecureRandom random = new SecureRandom();
	private final SecretKeySpec pepper;

	public OtpServiceImpl(OtpChallengeRepository challenges, MessageSender sender, AuthProperties props,
			Clock clock) {
		this.challenges = challenges;
		this.sender = sender;
		this.props = props;
		this.clock = clock;
		this.pepper = new SecretKeySpec(props.otpPepper().getBytes(StandardCharsets.UTF_8), "HmacSHA256");
	}

	@Override
	@Transactional
	public void request(String target, OtpPurpose purpose, OtpChannel channel, String ip) {
		create(target, purpose, channel, ip, true);
	}

	@Override
	@Transactional
	public void reserve(String target, OtpPurpose purpose, OtpChannel channel, String ip) {
		create(target, purpose, channel, ip, false);
	}

	private void create(String target, OtpPurpose purpose, OtpChannel channel, String ip, boolean deliver) {
		Instant now = clock.instant();
		InetAddress address = parseIp(ip);
		if (challenges.countRecentByTarget(target, now.minus(props.otpResendCooldown())) > 0
				|| challenges.countRecentByTarget(target, now.minus(WINDOW)) >= props.otpMaxPerTargetPerHour()
				|| (address != null
						&& challenges.countRecentByIp(address, now.minus(WINDOW)) >= props.otpMaxPerIpPerHour())) {
			throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "OTP_RATE_LIMITED", "Too many code requests");
		}
		String code = String.format("%06d", random.nextInt(1_000_000));
		OtpChallenge challenge = new OtpChallenge();
		challenge.setTarget(target);
		challenge.setPurpose(purpose);
		challenge.setChannel(channel);
		challenge.setCodeHash(hash(target, purpose, code));
		challenge.setIp(address);
		challenge.setCreatedAt(now);
		challenge.setExpiresAt(now.plus(props.otpTtl()));
		challenges.save(challenge);
		if (deliver) {
			sender.send(channel, target, purpose, code);
		}
	}

	/** A wrong attempt must be stored even though the request fails, hence no rollback on ApiException. */
	@Override
	@Transactional(noRollbackFor = ApiException.class)
	public void verify(String target, OtpPurpose purpose, String code) {
		Instant now = clock.instant();
		Optional<OtpChallenge> open = challenges
				.findFirstByTargetAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc(target, purpose);
		if (open.isEmpty()) {
			throw invalid();
		}
		OtpChallenge challenge = open.get();
		if (!challenge.getExpiresAt().isAfter(now) || challenge.getAttempts() >= props.otpMaxAttempts()) {
			throw invalid();
		}
		boolean matches = code != null && MessageDigest.isEqual(
				hash(target, purpose, code).getBytes(StandardCharsets.UTF_8),
				challenge.getCodeHash().getBytes(StandardCharsets.UTF_8));
		if (!matches) {
			challenges.incrementAttempts(challenge.getId());
			throw invalid();
		}
		if (!challenges.consumeIfOpen(challenge.getId(), now)) {
			throw invalid(); // a concurrent request consumed this code first
		}
	}

	private String hash(String target, OtpPurpose purpose, String code) {
		try {
			Mac mac = Mac.getInstance("HmacSHA256");
			mac.init(pepper);
			byte[] digest = mac.doFinal((target + ":" + purpose.value() + ":" + code).getBytes(StandardCharsets.UTF_8));
			return Base64.getEncoder().encodeToString(digest);
		} catch (Exception e) {
			throw new IllegalStateException("HMAC-SHA256 unavailable", e);
		}
	}

	private static InetAddress parseIp(String ip) {
		if (ip == null || !IP_LITERAL.matcher(ip).matches()) {
			return null;
		}
		try {
			return InetAddress.getByName(ip);
		} catch (Exception e) {
			return null;
		}
	}

	private static ApiException invalid() {
		return new ApiException(HttpStatus.BAD_REQUEST, "OTP_INVALID", "Invalid or expired code");
	}

}
