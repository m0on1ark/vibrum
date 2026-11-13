package pl.minibank.auth;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import pl.minibank.TestcontainersConfiguration;
import pl.minibank.auth.session.RefreshTokenRepository;
import pl.minibank.user.UserRepository;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class PasswordTests {

    private static final String NEW_PASSWORD = "new-password-456";
    private static final Pattern RESET_LINK = Pattern.compile("/auth/reset-password\\?token=([\\w-]+)");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private RefreshTokenRepository refreshTokenRepository;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private JavaMailSender mailSender;

    private AuthTestClient client;

    @BeforeEach
    void setUp() {
        client = new AuthTestClient(mockMvc);
        clearInvocations(mailSender);
    }

    @Test
    void changePasswordRemovesAllSessions() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        String accessToken = AuthTestClient.accessToken(client.register(email, "Firefox"));
        String chromeRefresh = AuthTestClient.refreshToken(client.login(email, AuthTestClient.PASSWORD, "Chrome"));

        mockMvc.perform(post("/api/users/me/password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword": "%s", "newPassword": "%s"}
                                """.formatted(AuthTestClient.PASSWORD, NEW_PASSWORD)))
                .andExpect(status().isNoContent());

        assertThat(sessionCount(email)).isZero();
        assertThat(client.refresh(chromeRefresh).getStatus()).isEqualTo(401);
        assertThat(client.login(email, AuthTestClient.PASSWORD, "Firefox").getStatus()).isEqualTo(401);
        assertThat(client.login(email, NEW_PASSWORD, "Firefox").getStatus()).isEqualTo(200);
    }

    @Test
    void changePasswordWithWrongCurrentPasswordReturnsUnauthorized() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        String accessToken = AuthTestClient.accessToken(client.register(email, "Firefox"));

        mockMvc.perform(post("/api/users/me/password")
                        .header("Authorization", "Bearer " + accessToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword": "wrong-password", "newPassword": "%s"}
                                """.formatted(NEW_PASSWORD)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.detail").value("Invalid email or password"));

        assertThat(sessionCount(email)).isEqualTo(1);
    }

    @Test
    void changePasswordWithoutTokenReturnsUnauthorized() throws Exception {
        mockMvc.perform(post("/api/users/me/password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"currentPassword": "x", "newPassword": "%s"}
                                """.formatted(NEW_PASSWORD)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void forgotPasswordForUnknownEmailReturnsNoContentAndSendsNothing() throws Exception {
        forgotPassword(AuthTestClient.uniqueEmail());

        verify(mailSender, never()).send(any(SimpleMailMessage.class));
    }

    @Test
    void resetPasswordChangesPasswordAndRemovesAllSessions() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        client.register(email, "Firefox");
        client.login(email, AuthTestClient.PASSWORD, "Chrome");

        forgotPassword(email);
        String token = sentResetToken(email);

        resetPassword(token, NEW_PASSWORD).andExpect(status().isNoContent());

        assertThat(sessionCount(email)).isZero();
        assertThat(client.login(email, AuthTestClient.PASSWORD, "Firefox").getStatus()).isEqualTo(401);
        assertThat(client.login(email, NEW_PASSWORD, "Firefox").getStatus()).isEqualTo(200);
    }

    @Test
    void resetTokenCannotBeUsedTwice() throws Exception {
        String email = AuthTestClient.uniqueEmail();
        client.register(email, "Firefox");
        forgotPassword(email);
        String token = sentResetToken(email);

        resetPassword(token, NEW_PASSWORD).andExpect(status().isNoContent());
        resetPassword(token, "another-password").andExpect(status().isBadRequest());
    }

    @Test
    void resetWithUnknownTokenReturnsBadRequest() throws Exception {
        resetPassword("unknown-token", NEW_PASSWORD).andExpect(status().isBadRequest());
    }

    private void forgotPassword(String email) throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email": "%s"}
                                """.formatted(email)))
                .andExpect(status().isNoContent());
    }

    private org.springframework.test.web.servlet.ResultActions resetPassword(String token, String newPassword)
            throws Exception {
        return mockMvc.perform(post("/api/auth/reset-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"token": "%s", "newPassword": "%s"}
                        """.formatted(token, newPassword)));
    }

    private String sentResetToken(String email) {
        ArgumentCaptor<SimpleMailMessage> captor = ArgumentCaptor.forClass(SimpleMailMessage.class);
        verify(mailSender).send(captor.capture());
        SimpleMailMessage message = captor.getValue();
        assertThat(message.getTo()).containsExactly(email);

        Matcher matcher = RESET_LINK.matcher(message.getText());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    private int sessionCount(String email) {
        Long userId = userRepository.findByEmailIgnoreCase(email).orElseThrow().getId();
        return refreshTokenRepository.findAllByUserId(userId).size();
    }
}
