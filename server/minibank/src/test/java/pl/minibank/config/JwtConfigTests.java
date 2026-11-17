package pl.minibank.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.env.MockEnvironment;
import pl.minibank.auth.JwtProperties;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtConfigTests {

    private static final String DEV_SECRET = "local-dev-secret-change-me-0123456789abcdef";
    private static final String REAL_SECRET = "f3b9c1d27a8e4b6c9d0e1f2a3b4c5d6e7f8091a2";

    @Test
    void rejectsDevSecretInProd() {
        assertThatThrownBy(() -> new JwtConfig(properties(DEV_SECRET), environment("prod")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    void acceptsRealSecretInProd() {
        assertThatCode(() -> new JwtConfig(properties(REAL_SECRET), environment("prod"))).doesNotThrowAnyException();
    }

    @Test
    void acceptsDevSecretOutsideProd() {
        assertThatCode(() -> new JwtConfig(properties(DEV_SECRET), environment("local"))).doesNotThrowAnyException();
    }

    @Test
    void rejectsShortSecret() {
        assertThatThrownBy(() -> new JwtConfig(properties("too-short"), environment("local")))
                .isInstanceOf(IllegalStateException.class);
    }

    private static JwtProperties properties(String secret) {
        return new JwtProperties(secret, Duration.ofMinutes(15));
    }

    private static MockEnvironment environment(String profile) {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles(profile);
        return environment;
    }
}
