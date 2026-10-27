package vn.tthome.identity.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import vn.tthome.identity.services.adminbootstrap.AdminBootstrapService;

/** Runs the first-administrator bootstrap on every start; it is a no-op unless an email is configured. */
@Component
public class AdminBootstrapRunner implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminBootstrapRunner.class);

	private final AdminBootstrapService bootstrap;
	private final BootstrapProperties props;

	public AdminBootstrapRunner(AdminBootstrapService bootstrap, BootstrapProperties props) {
		this.bootstrap = bootstrap;
		this.props = props;
	}

	@Override
	public void run(ApplicationArguments args) {
		if (!StringUtils.hasText(props.adminEmail())) {
			return;
		}
		if (bootstrap.ensureFirstAdmin(props.adminEmail(), props.adminPassword())) {
			log.warn("The first administrator was set up from BOOTSTRAP_ADMIN_EMAIL. Remove BOOTSTRAP_ADMIN_PASSWORD "
					+ "from the environment and change the password after signing in.");
		}
	}

}
