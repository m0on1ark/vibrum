package pl.minibank;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
class FlywayConfigurationTests {

    @Autowired
    private Flyway flyway;

    @Test
    void appliesMigrationsMergedOutOfOrder() {
        assertThat(flyway.getConfiguration().isOutOfOrder()).isTrue();
    }
}
