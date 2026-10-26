package vn.tthome.identity.support;

import java.lang.reflect.Proxy;
import java.net.InetAddress;
import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import vn.tthome.identity.models.entities.OtpChallenge;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.repos.otpchallenge.OtpChallengeRepository;

/** Behaviour-level fake of the OTP repository for unit tests (no database, no mocking framework). */
public final class InMemoryOtpRepository {

	private final List<OtpChallenge> rows = new ArrayList<>();
	private final Clock clock;

	public InMemoryOtpRepository(Clock clock) {
		this.clock = clock;
	}

	public List<OtpChallenge> rows() {
		return rows;
	}

	public OtpChallengeRepository repository() {
		return (OtpChallengeRepository) Proxy.newProxyInstance(getClass().getClassLoader(),
				new Class<?>[] { OtpChallengeRepository.class }, (proxy, method, args) -> switch (method.getName()) {
					case "save", "saveAndFlush" -> save((OtpChallenge) args[0]);
					case "findFirstByTargetAndPurposeAndConsumedAtIsNullOrderByCreatedAtDesc" ->
						newestOpen((String) args[0], (OtpPurpose) args[1]);
					case "countRecentByTarget" -> rows.stream()
							.filter(r -> r.getTarget().equals(args[0]) && r.getCreatedAt().isAfter((Instant) args[1]))
							.count();
					case "countRecentByIp" -> rows.stream()
							.filter(r -> args[0].equals(r.getIp()) && r.getCreatedAt().isAfter((Instant) args[1]))
							.count();
					case "incrementAttempts" -> {
						byId((UUID) args[0]).ifPresent(r -> r.setAttempts((short) (r.getAttempts() + 1)));
						yield null;
					}
					case "consumeIfOpen" -> byId((UUID) args[0]).filter(r -> r.getConsumedAt() == null).map(r -> {
						r.setConsumedAt((Instant) args[1]);
						return true;
					}).orElse(false);
					default -> throw new UnsupportedOperationException(method.getName());
				});
	}

	private OtpChallenge save(OtpChallenge c) {
		if (c.getId() == null) {
			c.setId(UUID.randomUUID());
			rows.add(c);
		}
		return c;
	}

	private Optional<OtpChallenge> byId(UUID id) {
		return rows.stream().filter(r -> id.equals(r.getId())).findFirst();
	}

	private Optional<OtpChallenge> newestOpen(String target, OtpPurpose purpose) {
		return rows.stream()
				.filter(r -> r.getTarget().equals(target) && r.getPurpose() == purpose && r.getConsumedAt() == null)
				.max(Comparator.comparing(OtpChallenge::getCreatedAt));
	}

	public static InetAddress ip(String literal) {
		try {
			return InetAddress.getByName(literal);
		} catch (Exception e) {
			throw new IllegalArgumentException(e);
		}
	}

}
