package vn.tthome.identity;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.test.context.ActiveProfiles;

/**
 * Starts the service against the dev-only Supabase database: Flyway baselines at V1 (schema applied by hand)
 * and applies V2. Run on request only: ./mvnw -pl services/identity-service -am -Psupabase test
 */
@Tag("supabase")
@SpringBootTest
@ActiveProfiles("supabase")
class SupabaseMigrationIT {

	@Autowired
	JdbcClient jdbc;

	@Test
	void flywayMigratedTheDevDatabaseToV2() {
		List<String> versions = jdbc.sql("select version from identity.flyway_schema_history where success")
				.query(String.class).list();

		assertThat(versions).contains("1", "2");
	}

	@Test
	void seededRolesExist() {
		Integer roles = jdbc.sql("select count(*) from identity.role where code in "
				+ "('TENANT','LANDLORD','AGENT','CONSULTANT','ADMIN')").query(Integer.class).single();

		assertThat(roles).isEqualTo(5);
	}

}
