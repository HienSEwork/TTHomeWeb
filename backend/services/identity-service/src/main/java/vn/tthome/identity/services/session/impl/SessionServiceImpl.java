package vn.tthome.identity.services.session.impl;

import java.net.InetAddress;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.regex.Pattern;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import vn.tthome.common.error.ApiException;
import vn.tthome.identity.config.AuthProperties;
import vn.tthome.identity.models.dtos.TokenPair;
import vn.tthome.identity.models.entities.RefreshToken;
import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserStatus;
import vn.tthome.identity.repos.refreshtoken.RefreshTokenRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.jwt.JwtService;
import vn.tthome.identity.services.session.SessionService;

@Service
public class SessionServiceImpl implements SessionService {

	private static final Pattern IP_LITERAL = Pattern.compile("^[0-9a-fA-F:.]+$");
	private static final int DEVICE_INFO_MAX = 255;

	private final RefreshTokenRepository refreshTokens;
	private final UserAccountRepository users;
	private final JwtService jwt;
	private final AuthProperties props;
	private final Clock clock;
	private final SecureRandom random = new SecureRandom();

	public SessionServiceImpl(RefreshTokenRepository refreshTokens, UserAccountRepository users, JwtService jwt,
			AuthProperties props, Clock clock) {
		this.refreshTokens = refreshTokens;
		this.users = users;
		this.jwt = jwt;
		this.props = props;
		this.clock = clock;
	}

	@Override
	@Transactional
	public TokenPair issue(UserAccount user, boolean rememberMe, String deviceInfo, String ip) {
		Instant now = clock.instant();
		String refreshToken = newOpaqueToken();
		RefreshToken row = new RefreshToken();
		row.setUserId(user.getId());
		row.setTokenHash(sha256Hex(refreshToken));
		row.setDeviceInfo(deviceInfo == null || deviceInfo.length() <= DEVICE_INFO_MAX ? deviceInfo
				: deviceInfo.substring(0, DEVICE_INFO_MAX));
		row.setIp(parseIp(ip));
		row.setCreatedAt(now);
		row.setExpiresAt(now.plus(rememberMe ? props.refreshTtlRemember() : props.refreshTtl()));
		row = refreshTokens.save(row);

		List<String> roles = user.getRoles().stream().map(Role::getCode).toList();
		String accessToken = jwt.issueAccessToken(user.getId(), row.getId(), roles);
		return new TokenPair(accessToken, jwt.expiresAt(accessToken), refreshToken, row.getExpiresAt());
	}

	/** Reuse detection revokes the user's sessions and then fails, so that revocation must be committed. */
	@Override
	@Transactional(noRollbackFor = ApiException.class)
	public TokenPair refresh(String refreshToken, String deviceInfo, String ip) {
		Instant now = clock.instant();
		RefreshToken row = refreshTokens.findByTokenHash(sha256Hex(refreshToken)).orElseThrow(SessionServiceImpl::invalid);
		if (row.getRevokedAt() != null) {
			refreshTokens.revokeAllActive(row.getUserId(), now);
			throw invalid();
		}
		if (!row.getExpiresAt().isAfter(now)) {
			throw invalid();
		}
		UserAccount user = users.findById(row.getUserId()).filter(u -> u.getDeletedAt() == null)
				.filter(u -> u.getStatus() == UserStatus.ACTIVE).orElseThrow(SessionServiceImpl::invalid);
		if (!refreshTokens.revokeIfActive(row.getId(), now)) {
			throw invalid(); // a concurrent refresh of the same token won
		}
		boolean remembered = Duration.between(row.getCreatedAt(), row.getExpiresAt()).compareTo(props.refreshTtl()) > 0;
		return issue(user, remembered, deviceInfo, ip);
	}

	private String newOpaqueToken() {
		byte[] raw = new byte[32];
		random.nextBytes(raw);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(raw);
	}

	static String sha256Hex(String value) {
		try {
			return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
		} catch (NoSuchAlgorithmException e) {
			throw new IllegalStateException("SHA-256 unavailable", e);
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
		return new ApiException(HttpStatus.UNAUTHORIZED, "TOKEN_INVALID", "Invalid or expired token");
	}

}
