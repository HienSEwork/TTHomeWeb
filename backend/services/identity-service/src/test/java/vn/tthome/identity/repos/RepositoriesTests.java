package vn.tthome.identity.repos;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.net.InetAddress;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import vn.tthome.identity.IdentityIntegrationTestBase;
import vn.tthome.identity.models.entities.OtpChallenge;
import vn.tthome.identity.models.entities.RefreshToken;
import vn.tthome.identity.models.entities.Role;
import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.OtpChannel;
import vn.tthome.identity.models.enums.OtpPurpose;
import vn.tthome.identity.repos.otpchallenge.OtpChallengeRepository;
import vn.tthome.identity.repos.refreshtoken.RefreshTokenRepository;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;

@Transactional
class RepositoriesTests extends IdentityIntegrationTestBase {

	@Autowired
	UserAccountRepository users;
	@Autowired
	RoleRepository roles;
	@Autowired
	OtpChallengeRepository otps;
	@Autowired
	RefreshTokenRepository refreshTokens;
	@Autowired
	JdbcClient jdbc;
	@Autowired
	EntityManager em;

	private static String randomPhone() {
		return "+849" + String.format("%08d", (long) (Math.random() * 100_000_000L));
	}

	private UserAccount newUser(String phone, String email) {
		UserAccount u = new UserAccount();
		u.setPhone(phone);
		u.setEmail(email);
		return users.saveAndFlush(u);
	}

	@Test
	void flywayAppliedV2AndV3OnTopOfBaseline() {
		List<String> versions = jdbc.sql("select version from identity.flyway_schema_history where success order by installed_rank")
				.query(String.class).list();

		assertThat(versions).contains("1", "2", "3");
	}

	@Test
	void rolesSeededByV1() {
		assertThat(roles.findAll()).extracting(Role::getCode)
				.contains("TENANT", "LANDLORD", "AGENT", "CONSULTANT", "ADMIN");
	}

	@Test
	void savesAndFindsUserByNormalizedPhoneAndEmail() {
		String phone = randomPhone();
		newUser(phone, "Foo" + UUID.randomUUID() + "@Bar.com");
		em.clear();

		assertThat(users.findByPhoneAndDeletedAtIsNull(phone)).isPresent();
		assertThat(users.findByEmailIgnoreCaseAndDeletedAtIsNull(users.findByPhoneAndDeletedAtIsNull(phone).get().getEmail().toLowerCase()))
				.isPresent();
		assertThat(users.findByPhoneAndDeletedAtIsNull(phone).get().getUserType().value()).isEqualTo("tenant");
	}

	@Test
	void phoneUniqueIndexRejectsDuplicate() {
		String phone = randomPhone();
		newUser(phone, null);

		assertThatThrownBy(() -> newUser(phone, null)).isInstanceOf(DataIntegrityViolationException.class);
	}

	@Test
	void refreshTokenRevokeAllActiveExceptKeepsOneRow() {
		UserAccount user = newUser(randomPhone(), null);
		Instant now = Instant.now();
		RefreshToken keep = null;
		for (int i = 0; i < 3; i++) {
			RefreshToken t = new RefreshToken();
			t.setUserId(user.getId());
			t.setTokenHash("hash-" + UUID.randomUUID());
			t.setExpiresAt(now.plusSeconds(3600));
			t = refreshTokens.saveAndFlush(t);
			if (i == 0) {
				keep = t;
			}
		}

		int revoked = refreshTokens.revokeAllActiveExcept(user.getId(), keep.getId(), now);
		em.clear();

		assertThat(revoked).isEqualTo(2);
		assertThat(refreshTokens.findById(keep.getId()).get().getRevokedAt()).isNull();
		assertThat(refreshTokens.revokeAllActive(user.getId(), now)).isEqualTo(1);
	}

	@Test
	void otpCountsByTargetAndByIpOnlyCountRecentRows() throws Exception {
		String target = randomPhone();
		InetAddress ip = InetAddress.getByName("203.0.113.7");
		Instant now = Instant.now();
		for (int i = 0; i < 2; i++) {
			OtpChallenge c = new OtpChallenge();
			c.setTarget(target);
			c.setPurpose(OtpPurpose.REGISTER);
			c.setChannel(OtpChannel.SMS);
			c.setCodeHash("x");
			c.setIp(ip);
			c.setExpiresAt(now.plusSeconds(300));
			otps.saveAndFlush(c);
		}

		assertThat(otps.countRecentByTarget(target, now.minusSeconds(3600))).isEqualTo(2);
		assertThat(otps.countRecentByTarget(target, now.plusSeconds(60))).isZero();
		assertThat(otps.countRecentByIp(ip, now.minusSeconds(3600))).isGreaterThanOrEqualTo(2);
	}

	@Test
	void consumeIfOpenSucceedsOnlyOnceAndIncrementAttemptsCounts() throws Exception {
		OtpChallenge c = new OtpChallenge();
		c.setTarget(randomPhone());
		c.setPurpose(OtpPurpose.LOGIN);
		c.setChannel(OtpChannel.SMS);
		c.setCodeHash("x");
		c.setExpiresAt(Instant.now().plusSeconds(300));
		c = otps.saveAndFlush(c);
		Instant now = Instant.now();

		otps.incrementAttempts(c.getId());
		otps.incrementAttempts(c.getId());
		boolean first = otps.consumeIfOpen(c.getId(), now);
		boolean second = otps.consumeIfOpen(c.getId(), now);
		em.clear();

		assertThat(first).isTrue();
		assertThat(second).isFalse();
		assertThat(otps.findById(c.getId()).get().getAttempts()).isEqualTo((short) 2);
	}

}
