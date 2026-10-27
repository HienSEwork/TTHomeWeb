package vn.tthome.identity.services.adminbootstrap.impl;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.Assert;

import vn.tthome.identity.models.entities.UserAccount;
import vn.tthome.identity.models.enums.UserType;
import vn.tthome.identity.repos.role.RoleRepository;
import vn.tthome.identity.repos.useraccount.UserAccountRepository;
import vn.tthome.identity.services.account.AccountService;
import vn.tthome.identity.services.adminbootstrap.AdminBootstrapService;
import vn.tthome.identity.services.contactnormalizer.ContactNormalizer;

@Service
public class AdminBootstrapServiceImpl implements AdminBootstrapService {

	private static final String ADMIN = "ADMIN";

	private final UserAccountRepository users;
	private final RoleRepository roles;
	private final AccountService accounts;
	private final ContactNormalizer normalizer;

	public AdminBootstrapServiceImpl(UserAccountRepository users, RoleRepository roles, AccountService accounts,
			ContactNormalizer normalizer) {
		this.users = users;
		this.roles = roles;
		this.accounts = accounts;
		this.normalizer = normalizer;
	}

	/**
	 * One transaction: the account (when new) and its role are created together, so a failure never leaves an account
	 * without the role. Two instances starting at once may both try to create it; the loser fails on the unique email
	 * and succeeds on its next start.
	 */
	@Override
	@Transactional
	public boolean ensureFirstAdmin(String email, String password) {
		if (users.existsByRolesCodeAndDeletedAtIsNull(ADMIN)) {
			return false;
		}
		String normalized = normalizer.email(email);
		UserAccount user = accounts.findByEmail(normalized).orElseGet(() -> {
			Assert.isTrue(password != null && password.length() >= 8 && password.length() <= 128,
					"The bootstrap admin password must be 8 to 128 characters");
			return accounts.createEmailAccount(normalized, null, password);
		});
		user.getRoles().add(roles.findByCode(ADMIN).orElseThrow());
		user.setUserType(UserType.ADMIN);
		users.saveAndFlush(user);
		return true;
	}

}
