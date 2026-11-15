package pl.minibank.auth;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;
import pl.minibank.auth.session.RefreshToken;
import pl.minibank.auth.session.RefreshTokenCookies;
import pl.minibank.auth.session.RefreshTokenRepository;
import pl.minibank.common.security.TokenHasher;
import pl.minibank.user.UserRepository;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class RefreshSessionTests {

    private static final String FIREFOX = "Mozilla/5.0 Firefox/140.0";
    private static final String CHROME = "Mozilla/5.0 Chrome/140.0";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private AuthTestClient client;

    @BeforeEach
    void setUp() {
        client = new AuthTestClient(mockMvc);
    }

    @Test
    void registerReturnsAccessTokenAndRefreshCookie() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        MockHttpServletResponse response = client.register(email, FIREFOX);

        assertThat(response.getStatus()).isEqualTo(201);
        assertThat(AuthTestClient.accessToken(response)).isNotBlank();
        assertRefreshCookie(response);

        String rawToken = AuthTestClient.refreshToken(response);
        List<RefreshToken> sessions = sessionsOf(email);
        assertThat(sessions).hasSize(1);
        assertThat(sessions.getFirst().getTokenHash())
                .isEqualTo(TokenHasher.sha256(rawToken))
                .isNotEqualTo(rawToken);
        assertThat(response.getContentAsString()).doesNotContain(rawToken);
    }

    @Test
    void loginReturnsAccessTokenAndRefreshCookie() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        client.register(email, FIREFOX);

        MockHttpServletResponse response = client.login(email, AuthTestClient.PASSWORD, FIREFOX);

        assertThat(response.getStatus()).isEqualTo(200);
        assertThat(AuthTestClient.accessToken(response)).isNotBlank();
        assertRefreshCookie(response);
        assertThat(sessionsOf(email).getFirst().getTokenHash())
                .isEqualTo(TokenHasher.sha256(AuthTestClient.refreshToken(response)));
    }

    @Test
    void loginFromSameBrowserReplacesSession() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        String first = AuthTestClient.refreshToken(client.register(email, FIREFOX));
        String second = AuthTestClient.refreshToken(client.login(email, AuthTestClient.PASSWORD, FIREFOX));

        List<RefreshToken> sessions = sessionsOf(email);
        assertThat(sessions).hasSize(1);
        assertThat(sessions.getFirst().getTokenHash()).isEqualTo(TokenHasher.sha256(second));
        assertThat(client.refresh(first).getStatus()).isEqualTo(401);
    }

    @Test
    void loginFromAnotherBrowserCreatesSecondSession() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        client.register(email, FIREFOX);
        client.login(email, AuthTestClient.PASSWORD, CHROME);

        assertThat(sessionsOf(email))
                .extracting(RefreshToken::getUserAgent)
                .containsExactlyInAnyOrder(FIREFOX, CHROME);
    }

    @Test
    void missingUserAgentIsStoredAsUnknown() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        client.register(email, "");

        assertThat(sessionsOf(email)).extracting(RefreshToken::getUserAgent).containsExactly("Unknown");
    }

    @Test
    void refreshRotatesTokens() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        MockHttpServletResponse registered = client.register(email, FIREFOX);
        String oldRefresh = AuthTestClient.refreshToken(registered);

        MockHttpServletResponse refreshed = client.refresh(oldRefresh);

        assertThat(refreshed.getStatus()).isEqualTo(200);
        assertThat(AuthTestClient.accessToken(refreshed)).isNotBlank();
        String newRefresh = AuthTestClient.refreshToken(refreshed);
        assertThat(newRefresh).isNotBlank().isNotEqualTo(oldRefresh);
        assertThat(sessionsOf(email)).hasSize(1);

        assertThat(client.refresh(oldRefresh).getStatus()).isEqualTo(401);
        assertThat(client.refresh(newRefresh).getStatus()).isEqualTo(200);
    }

    @Test
    void refreshWithExpiredTokenReturnsUnauthorizedAndDeletesSession() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        String refreshToken = AuthTestClient.refreshToken(client.register(email, FIREFOX));
        jdbcTemplate.update("update refresh_tokens set expires_at = now() - interval '1 minute' where token_hash = ?",
                TokenHasher.sha256(refreshToken));

        assertThat(client.refresh(refreshToken).getStatus()).isEqualTo(401);
        assertThat(sessionsOf(email)).isEmpty();
    }

    @Test
    void refreshWithoutCookieReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/auth/refresh"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void refreshWithUnknownTokenReturnsUnauthorized() throws Exception {
        assertThat(client.refresh("unknown-token").getStatus()).isEqualTo(401);
    }

    @Test
    void logoutRemovesOnlyCurrentSession() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        String firefoxRefresh = AuthTestClient.refreshToken(client.register(email, FIREFOX));
        String chromeRefresh = AuthTestClient.refreshToken(client.login(email, AuthTestClient.PASSWORD, CHROME));

        mockMvc.perform(post("/api/auth/logout")
                        .cookie(new Cookie(RefreshTokenCookies.COOKIE_NAME, firefoxRefresh)))
                .andExpect(status().isNoContent())
                .andExpect(cookie().maxAge(RefreshTokenCookies.COOKIE_NAME, 0));

        assertThat(sessionsOf(email)).extracting(RefreshToken::getUserAgent).containsExactly(CHROME);
        assertThat(client.refresh(firefoxRefresh).getStatus()).isEqualTo(401);
        assertThat(client.refresh(chromeRefresh).getStatus()).isEqualTo(200);
    }

    @Test
    void logoutWithoutCookieReturnsNoContent() throws Exception {
        mockMvc.perform(post("/api/auth/logout"))
                .andExpect(status().isNoContent());
    }

    private void assertRefreshCookie(MockHttpServletResponse response) {
        String header = response.getHeader(HttpHeaders.SET_COOKIE);
        assertThat(header)
                .startsWith(RefreshTokenCookies.COOKIE_NAME + "=")
                .contains("HttpOnly", "Path=/", "SameSite=Lax", "Max-Age=2592000");
    }

    private List<RefreshToken> sessionsOf(String email) {
        Long userId = userRepository.findByEmailIgnoreCase(email).orElseThrow().getId();
        return refreshTokenRepository.findAllByUserId(userId);
    }
}
