package vn.tthome.identity.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.boot.DefaultApplicationArguments;

import vn.tthome.identity.services.adminbootstrap.AdminBootstrapService;

class AdminBootstrapRunnerTest {

	private final List<String> calls = new ArrayList<>();
	private final AdminBootstrapService service = (email, password) -> {
		calls.add(email + "/" + password);
		return true;
	};

	@Test
	void anUnconfiguredBootstrapDoesNothing() {
		new AdminBootstrapRunner(service, new BootstrapProperties("", "")).run(new DefaultApplicationArguments());
		new AdminBootstrapRunner(service, new BootstrapProperties(null, null)).run(new DefaultApplicationArguments());

		assertThat(calls).isEmpty();
	}

	@Test
	void aConfiguredBootstrapAsksTheServiceOnce() {
		new AdminBootstrapRunner(service, new BootstrapProperties("root@example.com", "correct-horse-battery"))
				.run(new DefaultApplicationArguments());

		assertThat(calls).containsExactly("root@example.com/correct-horse-battery");
	}

	/** The password is only needed while there is no admin yet: whether that is so is the service's call, not the runner's. */
	@Test
	void anEmailWithoutAPasswordIsPassedOnToTheService() {
		new AdminBootstrapRunner(service, new BootstrapProperties("root@example.com", null))
				.run(new DefaultApplicationArguments());

		assertThat(calls).containsExactly("root@example.com/null");
	}

}
