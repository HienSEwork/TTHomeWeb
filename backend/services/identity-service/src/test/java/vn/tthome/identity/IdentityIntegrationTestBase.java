package vn.tthome.identity;

import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.ActiveProfiles;

/** Full application context on a Testcontainers PostgreSQL initialised with db/tthome_schema.sql (Flyway V1). */
@SpringBootTest
@ActiveProfiles("test")
@Import(TestcontainersConfiguration.class)
public abstract class IdentityIntegrationTestBase {

}
